import Stripe from "stripe";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { purchases, users } from "../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { PRODUCTS, PRODUCT_KEYS, ProductKey } from "./products";
import { storageGetSignedUrl } from "./storage";

// ─── Stripe client (lazy) ─────────────────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

// ─── DB helpers ───────────────────────────────────────────────────────────────
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

    // Idempotency check
    const existing = await getPurchaseBySessionId(session.id);
    if (existing) {
      console.log(`[Stripe] Session ${session.id} already processed, skipping`);
      return { received: true };
    }

    const userId = parseInt(session.metadata?.user_id ?? "0", 10);
    const productKey = session.metadata?.product_key ?? "";

    if (!userId || !productKey || !PRODUCT_KEYS.includes(productKey as ProductKey)) {
      console.error("[Stripe] Missing or invalid metadata on session:", session.id);
      return { received: true };
    }

    const amountCents = session.amount_total ?? 0;
    const currency = session.currency ?? "usd";
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

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

  return { received: true };
}
