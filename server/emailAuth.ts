import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

export function registerEmailAuthRoutes(app: Express) {
  // Register with Email and Password
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await db.getUserByEmail(normalizedEmail);
      if (existingUser) {
        res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
        return;
      }

      const openId = `email_${crypto.randomUUID()}`;
      const passwordHash = hashPassword(password);

      await db.upsertUser({
        openId,
        email: normalizedEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        loginMethod: "email",
        passwordHash,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      const sessionToken = await sdk.createSessionToken(openId, {
        name: user?.name || name || normalizedEmail,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user?.id,
          openId,
          email: normalizedEmail,
          name: user?.name || name || null,
        },
      });
    } catch (error) {
      console.error("[EmailAuth] Registration failed:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // Login with Email and Password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const user = await db.getUserByEmail(normalizedEmail);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Check 2FA
      const tfa = await db.getTwoFactorByUserId(user.id);
      if (tfa?.isEnabled) {
        const pendingToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.createPendingTwoFactor({
          token: pendingToken,
          userId: user.id,
          openId: user.openId,
          userName: user.name,
          expiresAt,
        });
        res.json({
          requires2FA: true,
          pendingToken,
        });
        return;
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user.id,
          openId: user.openId,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error("[EmailAuth] Login failed:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });
}
