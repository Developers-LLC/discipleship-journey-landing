/**
 * Two-Factor Authentication tRPC router.
 *
 * Procedures:
 *  twoFactor.status          — get current 2FA status for the signed-in user
 *  twoFactor.setupTotp       — generate a TOTP secret + QR code URI (not yet enabled)
 *  twoFactor.confirmTotp     — verify a TOTP code and enable TOTP 2FA
 *  twoFactor.sendSmsCode     — send a Twilio Verify SMS OTP to a phone number
 *  twoFactor.confirmSms      — verify the SMS OTP and enable SMS 2FA
 *  twoFactor.disable         — disable and delete 2FA for the user
 *  twoFactor.verifyChallenge — verify a 2FA challenge for a pending session token
 */
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { z } from "zod";
import * as db from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

// ─── Encryption helpers (AES-256-GCM) ────────────────────────────────────────
// We encrypt the TOTP secret at rest using the JWT_SECRET as key material.

function getDerivedKey(): Buffer {
  const secret = process.env.JWT_SECRET ?? "fallback-dev-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptSecret(plaintext: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decryptSecret(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(":");
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc).toString("utf8") + decipher.final("utf8");
}

// ─── Backup codes ─────────────────────────────────────────────────────────────

function generateBackupCodes(): { plain: string[]; hashed: string } {
  const plain = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );
  const hashed = JSON.stringify(
    plain.map((c) => crypto.createHash("sha256").update(c).digest("hex"))
  );
  return { plain, hashed };
}

// ─── Twilio Verify helpers ────────────────────────────────────────────────────

async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "SMS 2FA is not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    });
  }
  const { default: twilio } = await import("twilio");
  return twilio(accountSid, authToken);
}

function getTwilioServiceSid(): string {
  const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "SMS 2FA is not configured. Please add TWILIO_VERIFY_SERVICE_SID.",
    });
  }
  return sid;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const twoFactorRouter = router({
  /** Return current 2FA status for the signed-in user */
  status: protectedProcedure.query(async ({ ctx }) => {
    const record = await db.getTwoFactorByUserId(ctx.user.id);
    return {
      isEnabled: record?.isEnabled ?? false,
      method: record?.isEnabled ? record.method : null,
      phoneNumber:
        record?.isEnabled && record.method === "sms"
          ? record.phoneNumber?.replace(/\d(?=\d{4})/g, "*")
          : null,
    };
  }),

  /** Generate a new TOTP secret and return a QR code data URL (setup step 1) */
  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    const secretObj = speakeasy.generateSecret({ length: 20 });
    const base32Secret = secretObj.base32;
    const appName = "The Discipleship Journey";
    const label = ctx.user.email ?? ctx.user.name ?? ctx.user.openId;
    const otpauth = speakeasy.otpauthURL({
      secret: base32Secret,
      label: encodeURIComponent(label),
      issuer: appName,
      encoding: "base32",
    });
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    // Store the (not-yet-enabled) encrypted secret
    await db.upsertTwoFactor({
      userId: ctx.user.id,
      method: "totp",
      totpSecret: encryptSecret(base32Secret),
      isEnabled: false,
    });

    return { secret: base32Secret, qrDataUrl };
  }),

  /** Verify a TOTP code and activate TOTP 2FA */
  confirmTotp: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const record = await db.getTwoFactorByUserId(ctx.user.id);
      if (!record?.totpSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No TOTP setup in progress." });
      }
      const secret = decryptSecret(record.totpSecret);
      const valid = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token: input.code,
        window: 1,
      });
      if (!valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid code. Please try again." });
      }
      const { plain, hashed } = generateBackupCodes();
      await db.enableTwoFactor(ctx.user.id, hashed);
      return { success: true, backupCodes: plain };
    }),

  /** Send a Twilio Verify SMS OTP to the given phone number (setup step 1) */
  sendSmsCode: protectedProcedure
    .input(z.object({ phoneNumber: z.string().min(7).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const client = await getTwilioClient();
      const serviceSid = getTwilioServiceSid();
      await client.verify.v2.services(serviceSid).verifications.create({
        to: input.phoneNumber,
        channel: "sms",
      });
      // Store phone number (not yet enabled)
      await db.upsertTwoFactor({
        userId: ctx.user.id,
        method: "sms",
        phoneNumber: input.phoneNumber,
        isEnabled: false,
      });
      return { sent: true };
    }),

  /** Verify the SMS OTP and activate SMS 2FA */
  confirmSms: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const record = await db.getTwoFactorByUserId(ctx.user.id);
      if (!record?.phoneNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No SMS setup in progress." });
      }
      const client = await getTwilioClient();
      const serviceSid = getTwilioServiceSid();
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: record.phoneNumber, code: input.code });
      if (check.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code." });
      }
      const { plain, hashed } = generateBackupCodes();
      await db.enableTwoFactor(ctx.user.id, hashed);
      return { success: true, backupCodes: plain };
    }),

  /** Disable and remove 2FA for the user */
  disable: protectedProcedure.mutation(async ({ ctx }) => {
    await db.disableTwoFactor(ctx.user.id);
    return { success: true };
  }),

  /**
   * Verify a 2FA challenge for a pending session.
   * Called from /2fa-challenge after OAuth login when 2FA is enabled.
   * On success, issues the real session cookie.
   */
  verifyChallenge: publicProcedure
    .input(z.object({ pendingToken: z.string(), code: z.string().min(6).max(8) }))
    .mutation(async ({ ctx, input }) => {
      const pending = await db.getPendingTwoFactor(input.pendingToken);
      if (!pending) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session expired. Please sign in again.",
        });
      }

      const tfa = await db.getTwoFactorByUserId(pending.userId);
      if (!tfa?.isEnabled) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "2FA not configured.",
        });
      }

      let verified = false;

      if (tfa.method === "totp" && tfa.totpSecret) {
        const secret = decryptSecret(tfa.totpSecret);
        verified = speakeasy.totp.verify({
          secret,
          encoding: "base32",
          token: input.code,
          window: 1,
        });

        // Check backup codes if TOTP fails
        if (!verified && tfa.backupCodes) {
          const codes: string[] = JSON.parse(tfa.backupCodes);
          const inputHash = crypto
            .createHash("sha256")
            .update(input.code.toUpperCase())
            .digest("hex");
          const idx = codes.indexOf(inputHash);
          if (idx !== -1) {
            verified = true;
            codes.splice(idx, 1);
            await db.upsertTwoFactor({
              userId: pending.userId,
              method: "totp",
              backupCodes: JSON.stringify(codes),
            });
          }
        }
      } else if (tfa.method === "sms" && tfa.phoneNumber) {
        const client = await getTwilioClient();
        const serviceSid = getTwilioServiceSid();
        const check = await client.verify.v2
          .services(serviceSid)
          .verificationChecks.create({ to: tfa.phoneNumber, code: input.code });
        verified = check.status === "approved";
      }

      if (!verified) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid code. Please try again.",
        });
      }

      // Clean up pending token
      await db.deletePendingTwoFactor(input.pendingToken);

      // Issue the real session cookie via the SDK
      const sessionToken = await sdk.createSessionToken(pending.openId, {
        name: pending.userName ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const res = (ctx as any).res;
      if (res) {
        const cookieOptions = getSessionCookieOptions(
          { headers: { host: res.req?.headers?.host ?? "" } } as any
        );
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      }

      return { success: true };
    }),
});
