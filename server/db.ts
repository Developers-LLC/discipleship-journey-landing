import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertTwoFactorAuth, InsertUser, pendingTwoFactor, twoFactorAuth, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserName(openId: string, name: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.openId, openId));
}

// ─── 2FA helpers ─────────────────────────────────────────────────────────────

export async function getTwoFactorByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(twoFactorAuth).where(eq(twoFactorAuth.userId, userId)).limit(1);
  return result[0] ?? undefined;
}

export async function upsertTwoFactor(data: InsertTwoFactorAuth): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(twoFactorAuth).values(data).onConflictDoUpdate({
    target: twoFactorAuth.userId,
    set: data,
  });
}

export async function enableTwoFactor(userId: number, backupCodes: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(twoFactorAuth)
    .set({ isEnabled: true, backupCodes, updatedAt: new Date() })
    .where(eq(twoFactorAuth.userId, userId));
}

export async function disableTwoFactor(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(twoFactorAuth).where(eq(twoFactorAuth.userId, userId));
}

// ─── Pending 2FA session helpers ─────────────────────────────────────────────

export async function createPendingTwoFactor(data: {
  token: string;
  userId: number;
  openId: string;
  userName: string | null;
  expiresAt: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pendingTwoFactor).values(data);
}

export async function getPendingTwoFactor(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pendingTwoFactor)
    .where(and(eq(pendingTwoFactor.token, token), gt(pendingTwoFactor.expiresAt, sql`NOW()`)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function deletePendingTwoFactor(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pendingTwoFactor).where(eq(pendingTwoFactor.token, token));
}
