import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

/**
 * Two-factor authentication settings per user.
 * A user can have at most one active 2FA method at a time.
 */
export const twoFactorAuth = mysqlTable("two_factor_auth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** 'totp' = authenticator app, 'sms' = SMS OTP via Twilio */
  method: mysqlEnum("method", ["totp", "sms"]).notNull(),
  /** AES-256-GCM encrypted TOTP secret (null for SMS method) */
  totpSecret: text("totpSecret"),
  /** E.164 phone number for SMS method (null for TOTP) */
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  /** Whether 2FA has been fully confirmed and is active */
  isEnabled: boolean("isEnabled").default(false).notNull(),
  /** JSON array of one-time backup codes (hashed) */
  backupCodes: text("backupCodes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

/**
 * Short-lived pending 2FA sessions.
 * After OAuth callback, if user has 2FA enabled, we store a pending token here
 * instead of issuing the full session cookie. The user must pass the 2FA
 * challenge to exchange this token for a real session.
 */
export const pendingTwoFactor = mysqlTable("pending_two_factor", {
  id: int("id").autoincrement().primaryKey(),
  /** Opaque random token sent to the browser as a short-lived cookie */
  token: varchar("token", { length: 128 }).notNull().unique(),
  userId: int("userId").notNull(),
  openId: varchar("openId", { length: 64 }).notNull(),
  userName: text("userName"),
  /** Expiry — 10 minutes from creation */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PendingTwoFactor = typeof pendingTwoFactor.$inferSelect;

/**
 * Records a completed purchase. Stripe is the source of truth for payment
 * details; we only store the identifiers needed to fulfil orders locally.
 */
export const purchases = mysqlTable("purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Stripe Checkout Session ID — used to look up full payment details */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  /** Stripe Payment Intent ID for reference */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Product key: 'belong' | 'grow' | 'go' | 'bundle' */
  productKey: varchar("productKey", { length: 32 }).notNull(),
  /** Amount paid in cents (cached for display without Stripe API call) */
  amountCents: int("amountCents").notNull(),
  /** ISO currency code e.g. 'usd' */
  currency: varchar("currency", { length: 8 }).notNull().default("usd"),
  /** fulfilled = download links unlocked */
  status: mysqlEnum("status", ["pending", "fulfilled", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Gift tokens — created when a buyer purchases a book as a gift.
 * The recipient redeems the token at /gift/:token to claim the book.
 */
export const gifts = mysqlTable("gifts", {
  id: int("id").autoincrement().primaryKey(),
  /** Opaque URL-safe token sent to the recipient */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** Buyer's user ID */
  senderUserId: int("senderUserId").notNull(),
  /** Recipient email address (entered by buyer at checkout) */
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  /** Recipient display name (entered by buyer) */
  recipientName: varchar("recipientName", { length: 255 }),
  /** Optional personal message from the buyer */
  message: text("message"),
  /** Product key: 'belong' | 'grow' | 'go' | 'bundle' */
  productKey: varchar("productKey", { length: 32 }).notNull(),
  /** Stripe Checkout Session ID that funded this gift */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  /** Amount paid in cents */
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("usd"),
  /** pending = not yet redeemed, redeemed = claimed by recipient */
  status: mysqlEnum("status", ["pending", "redeemed"]).default("pending").notNull(),
  /** User ID of the person who redeemed the gift (null until redeemed) */
  redeemedByUserId: int("redeemedByUserId"),
  redeemedAt: timestamp("redeemedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = typeof gifts.$inferInsert;

/**
 * Referral codes — generated for a user after their first purchase.
 * Each code maps to a Stripe coupon (20% off) that new buyers can apply at checkout.
 * One code per user; reuse the same code for all shares.
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who owns / shares this referral code */
  userId: int("userId").notNull().unique(),
  /** Human-readable promo code stored in Stripe (e.g. "THOMAS20") */
  code: varchar("code", { length: 64 }).notNull().unique(),
  /** Stripe Coupon ID backing this code */
  stripeCouponId: varchar("stripeCouponId", { length: 255 }).notNull(),
  /** Stripe Promotion Code ID (the redeemable object) */
  stripePromoCodeId: varchar("stripePromoCodeId", { length: 255 }).notNull(),
  /** Number of times the code has been used (cached from Stripe) */
  timesUsed: int("timesUsed").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;
