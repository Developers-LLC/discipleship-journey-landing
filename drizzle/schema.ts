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
