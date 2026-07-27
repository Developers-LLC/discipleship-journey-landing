import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const twoFactorMethodEnum = pgEnum("two_factor_method", ["totp", "sms"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "fulfilled", "refunded"]);
export const giftStatusEnum = pgEnum("gift_status", ["pending", "redeemed"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by PostgreSQL.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Two-factor authentication settings per user.
 * A user can have at most one active 2FA method at a time.
 */
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  /** 'totp' = authenticator app, 'sms' = SMS OTP via Twilio */
  method: twoFactorMethodEnum("method").notNull(),
  /** AES-256-GCM encrypted TOTP secret (null for SMS method) */
  totpSecret: text("totpSecret"),
  /** E.164 phone number for SMS method (null for TOTP) */
  phoneNumber: varchar("phoneNumber", { length: 32 }),
  /** Whether 2FA has been fully confirmed and is active */
  isEnabled: boolean("isEnabled").default(false).notNull(),
  /** JSON array of one-time backup codes (hashed) */
  backupCodes: text("backupCodes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

/**
 * Short-lived pending 2FA sessions.
 * After OAuth callback, if user has 2FA enabled, we store a pending token here
 * instead of issuing the full session cookie. The user must pass the 2FA
 * challenge to exchange this token for a real session.
 */
export const pendingTwoFactor = pgTable("pending_two_factor", {
  id: serial("id").primaryKey(),
  /** Opaque random token sent to the browser as a short-lived cookie */
  token: varchar("token", { length: 128 }).notNull().unique(),
  userId: integer("userId").notNull(),
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
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** Stripe Checkout Session ID — used to look up full payment details */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  /** Stripe Payment Intent ID for reference */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Product key: 'belong' | 'grow' | 'go' | 'bundle' */
  productKey: varchar("productKey", { length: 32 }).notNull(),
  /** Amount paid in cents (cached for display without Stripe API call) */
  amountCents: integer("amountCents").notNull(),
  /** ISO currency code e.g. 'usd' */
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  /** fulfilled = download links unlocked */
  status: purchaseStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Gift tokens — created when a buyer purchases a book as a gift.
 * The recipient redeems the token at /gift/:token to claim the book.
 */
export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  /** Opaque URL-safe token sent to the recipient */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** Buyer's user ID */
  senderUserId: integer("senderUserId").notNull(),
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
  amountCents: integer("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  /** pending = not yet redeemed, redeemed = claimed by recipient */
  status: giftStatusEnum("status").default("pending").notNull(),
  /** User ID of the person who redeemed the gift (null until redeemed) */
  redeemedByUserId: integer("redeemedByUserId"),
  redeemedAt: timestamp("redeemedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = typeof gifts.$inferInsert;
