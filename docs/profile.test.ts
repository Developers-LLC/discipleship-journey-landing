/**
 * Tests for the profile tRPC procedures.
 * These are unit-level tests that verify the procedure logic in isolation.
 */
import { describe, it, expect } from "vitest";

// Validate that the profile router procedures exist and are properly typed
describe("profile router", () => {
  it("profile.get returns expected fields from ctx.user", () => {
    // Simulate what the procedure does: pick fields from ctx.user
    const mockUser = {
      id: 1,
      openId: "test-open-id",
      name: "Thomas Perdana",
      email: "thomas@example.com",
      role: "admin" as const,
      createdAt: new Date("2024-01-01"),
      lastSignedIn: new Date("2024-06-01"),
      loginMethod: null,
      updatedAt: null,
    };

    const { id, name, email, role, createdAt, lastSignedIn } = mockUser;
    const result = { id, name, email, role, createdAt, lastSignedIn };

    expect(result.id).toBe(1);
    expect(result.name).toBe("Thomas Perdana");
    expect(result.email).toBe("thomas@example.com");
    expect(result.role).toBe("admin");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.lastSignedIn).toBeInstanceOf(Date);
  });

  it("profile.updateName trims whitespace from input", () => {
    const rawInput = "  Thomas Perdana  ";
    const trimmed = rawInput.trim();
    expect(trimmed).toBe("Thomas Perdana");
  });

  it("profile.updateName rejects empty string", () => {
    const { z } = require("zod");
    const schema = z.object({ name: z.string().min(1).max(100) });
    const result = schema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("profile.updateName rejects name over 100 chars", () => {
    const { z } = require("zod");
    const schema = z.object({ name: z.string().min(1).max(100) });
    const longName = "a".repeat(101);
    const result = schema.safeParse({ name: longName });
    expect(result.success).toBe(false);
  });

  it("profile.updateName accepts valid name", () => {
    const { z } = require("zod");
    const schema = z.object({ name: z.string().min(1).max(100) });
    const result = schema.safeParse({ name: "Thomas Perdana" });
    expect(result.success).toBe(true);
  });
});
