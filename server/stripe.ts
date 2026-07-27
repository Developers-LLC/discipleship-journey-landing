import Stripe from "stripe";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { purchases, users, gifts } from "../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { PRODUCTS, PRODUCT_KEYS, ProductKey } from "./products";
import { storageGetSignedUrl } from "./storage";
import { notifyOwner } from "./_core/notification";
import crypto from "crypto";

// ─── Stripe client (lazy) ─────────────────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

// ─── Purchase DB helpers ──────────────────────────────────────────────────────
export async function createPurchase(data: {
  userId: number;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  productKey: string;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(purchases).values({ ...data, status: "fulfilled" });
}

export async function getPurchasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchases).where(eq(purchases.userId, userId));
}

export async function getPurchaseBySessionId(stripeSessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(purchases).where(eq(purchases.stripeSessionId, stripeSessionId)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] ?? undefined;
}

// ─── Gift DB helpers ──────────────────────────────────────────────────────────
function generateGiftToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createGift(data: {
  token: string;
  senderUserId: number;
  recipientEmail: string;
  recipientName: string | null;
  message: string | null;
  productKey: string;
  stripeSessionId: string;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(gifts).values({ ...data, status: "pending" });
}

export async function getGiftByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gifts).where(eq(gifts.token, token)).limit(1);
  return result[0] ?? undefined;
}

export async function getGiftBySessionId(stripeSessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gifts).where(eq(gifts.stripeSessionId, stripeSessionId)).limit(1);
  return result[0] ?? undefined;
}

export async function redeemGiftToken(token: string, redeemedByUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gifts)
    .set({ status: "redeemed", redeemedByUserId, redeemedAt: new Date() })
    .where(and(eq(gifts.token, token), eq(gifts.status, "pending")));
}

export async function getGiftsSentByUser(senderUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gifts).where(eq(gifts.senderUserId, senderUserId));
}

export async function getGiftsReceivedByUser(redeemedByUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gifts).where(and(eq(gifts.redeemedByUserId, redeemedByUserId), eq(gifts.status, "redeemed")));
}

// ─── tRPC router ─────────────────────────────────────────────────────────────
export const stripeRouter = router({
  /** Create a Stripe Checkout session for a given product */
  createCheckout: protectedProcedure
    .input(z.object({ productKey: z.enum(["belong", "grow", "go", "bundle"]) }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const product = PRODUCTS[input.productKey];
      const origin = ctx.req.headers.origin || "https://bible.thomasperdana.com";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        customer_email: ctx.user.email ?? undefined,
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          product_key: input.productKey,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: product.priceCents,
              product_data: {
                name: product.title,
                description: product.description,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/#books`,
      });

      return { url: session.url! };
    }),

  /** Return the current user's completed purchases */
  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    return getPurchasesByUserId(ctx.user.id);
  }),

  /** Check if the current user owns a specific product */
  owns: protectedProcedure
    .input(z.object({ productKey: z.enum(["belong", "grow", "go", "bundle"]) }))
    .query(async ({ ctx, input }) => {
      const userPurchases = await getPurchasesByUserId(ctx.user.id);
      const ownsBundle = userPurchases.some(p => p.productKey === "bundle" && p.status === "fulfilled");
      const ownsProduct = userPurchases.some(p => p.productKey === input.productKey && p.status === "fulfilled");
      return { owned: ownsBundle || ownsProduct };
    }),

  /** Generate a short-lived presigned download URL for an owned ebook (10-minute expiry) */
  getDownloadUrl: protectedProcedure
    .input(z.object({ productKey: z.enum(["belong", "grow", "go"]) }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership — bundle purchase also grants access to individual books
      const userPurchases = await getPurchasesByUserId(ctx.user.id);
      const ownsBundle = userPurchases.some(p => p.productKey === "bundle" && p.status === "fulfilled");
      const ownsProduct = userPurchases.some(p => p.productKey === input.productKey && p.status === "fulfilled");
      if (!ownsBundle && !ownsProduct) {
        throw new Error("You do not own this book");
      }

      const product = PRODUCTS[input.productKey];
      // TypeScript: downloadKey is defined on belong/grow/go but not bundle
      const downloadKey = (product as { downloadKey: string }).downloadKey;
      if (!downloadKey) throw new Error("No download file configured for this product");

      // Get a presigned direct-download URL valid for 10 minutes
      const signedUrl = await storageGetSignedUrl(downloadKey);
      const downloadName = (product as { downloadName: string }).downloadName ?? `${product.title}.pdf`;
      return { url: signedUrl, filename: downloadName };
    }),

  /** Return all product definitions (public — used by the books section) */
  products: publicProcedure.query(() => {
    return PRODUCT_KEYS.map(key => ({
      ...PRODUCTS[key],
      key: key,
    }));
  }),

  /** Create a Stripe Checkout session for a gift purchase */
  createGiftCheckout: protectedProcedure
    .input(z.object({
      productKey: z.enum(["belong", "grow", "go", "bundle"]),
      recipientEmail: z.string().email(),
      recipientName: z.string().max(255).optional(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const product = PRODUCTS[input.productKey];
      const origin = ctx.req.headers.origin || "https://bible.thomasperdana.com";
      const giftToken = generateGiftToken();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        customer_email: ctx.user.email ?? undefined,
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          product_key: input.productKey,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          is_gift: "true",
          gift_token: giftToken,
          recipient_email: input.recipientEmail,
          recipient_name: input.recipientName ?? "",
          gift_message: input.message ?? "",
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: product.priceCents,
              product_data: {
                name: `Gift: ${product.title}`,
                description: `A gift of "${product.title}" for ${input.recipientEmail}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/orders?gift=sent&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/#books`,
      });

      return { url: session.url! };
    }),

  /** Look up a gift by its redemption token (public) */
  getGift: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const gift = await getGiftByToken(input.token);
      if (!gift) return null;
      return {
        token: gift.token,
        recipientEmail: gift.recipientEmail,
        recipientName: gift.recipientName,
        message: gift.message,
        productKey: gift.productKey,
        status: gift.status,
        productTitle: PRODUCTS[gift.productKey as ProductKey]?.title ?? gift.productKey,
        productSubtitle: PRODUCTS[gift.productKey as ProductKey]?.subtitle ?? "",
        createdAt: gift.createdAt,
      };
    }),

  /** Redeem a gift token — claims the book for the currently logged-in user */
  redeemGift: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const gift = await getGiftByToken(input.token);
      if (!gift) throw new Error("Gift not found or invalid link.");
      if (gift.status === "redeemed") throw new Error("This gift has already been redeemed.");

      await redeemGiftToken(input.token, ctx.user.id);

      // Create a purchase record so the book appears in My Books / Orders
      await createPurchase({
        userId: ctx.user.id,
        stripeSessionId: `gift_${gift.token}`,
        stripePaymentIntentId: null,
        productKey: gift.productKey,
        amountCents: 0,
        currency: "usd",
      });

      return { success: true, productKey: gift.productKey };
    }),

  /** Return gifts sent by the current user */
  myGiftsSent: protectedProcedure.query(async ({ ctx }) => {
    return getGiftsSentByUser(ctx.user.id);
  }),

  /** Return gifts received (redeemed) by the current user */
  myGiftsReceived: protectedProcedure.query(async ({ ctx }) => {
    return getGiftsReceivedByUser(ctx.user.id);
  }),
});

// ─── Stripe webhook handler (registered in server/_core/index.ts) ─────────────
export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[Stripe] STRIPE_WEBHOOK_SECRET not set — skipping webhook");
    return { received: false };
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe] Webhook signature verification failed:", err);
    throw new Error("Invalid webhook signature");
  }

  // Test events — return verification response
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe] Test event detected, returning verification response");
    return { received: true };
  }

  console.log(`[Stripe] Webhook received: ${event.type} (${event.id})`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = parseInt(session.metadata?.user_id ?? "0", 10);
    const productKey = session.metadata?.product_key ?? "";
    const isGift = session.metadata?.is_gift === "true";

    if (!userId || !productKey || !PRODUCT_KEYS.includes(productKey as ProductKey)) {
      console.error("[Stripe] Missing or invalid metadata on session:", session.id);
      return { received: true };
    }

    const amountCents = session.amount_total ?? 0;
    const currency = session.currency ?? "usd";
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    if (isGift) {
      // Gift purchase: create a gift token record (buyer does NOT get the book)
      const existingGift = await getGiftBySessionId(session.id);
      if (existingGift) {
        console.log(`[Stripe] Gift session ${session.id} already processed, skipping`);
        return { received: true };
      }

      const giftToken = session.metadata?.gift_token;
      const recipientEmail = session.metadata?.recipient_email ?? "";
      const recipientName = session.metadata?.recipient_name ?? null;
      const giftMessage = session.metadata?.gift_message ?? null;

      if (!giftToken || !recipientEmail) {
        console.error("[Stripe] Gift metadata missing token or recipient email:", session.id);
        return { received: true };
      }

      await createGift({
        token: giftToken,
        senderUserId: userId,
        recipientEmail,
        recipientName: recipientName || null,
        message: giftMessage || null,
        productKey,
        stripeSessionId: session.id,
        amountCents,
        currency,
      });

      const senderName = session.metadata?.customer_name || "A buyer";
      const productTitle = PRODUCTS[productKey as ProductKey]?.title ?? productKey;
      await notifyOwner({
        title: `Gift Purchase: ${productTitle}`,
        content: `${senderName} gifted "${productTitle}" to ${recipientEmail}. Redemption link: https://bible.thomasperdana.com/gift/${giftToken}`,
      }).catch(() => {});

      console.log(`[Stripe] Gift created: token=${giftToken} product=${productKey} recipient=${recipientEmail}`);
    } else {
      // Regular purchase: idempotency check then create purchase record
      const existing = await getPurchaseBySessionId(session.id);
      if (existing) {
        console.log(`[Stripe] Session ${session.id} already processed, skipping`);
        return { received: true };
      }

      await createPurchase({
        userId,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        productKey,
        amountCents,
        currency,
      });

      console.log(`[Stripe] Purchase fulfilled: user=${userId} product=${productKey} amount=${amountCents}`);
    }
  }

  return { received: true };
}
