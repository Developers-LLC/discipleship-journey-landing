import { describe, expect, it } from "vitest";
import request from "supertest";
import { createExpressApp } from "./_core/app";
import { hashPassword, verifyPassword } from "./emailAuth";

describe("Email Auth Utilities & API Routes", () => {
  const app = createExpressApp();

  it("hashPassword and verifyPassword work correctly", () => {
    const rawPassword = "SecurePassword123!";
    const hash = hashPassword(rawPassword);
    expect(hash).toBeDefined();
    expect(hash).toContain(":");
    expect(verifyPassword(rawPassword, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("POST /api/auth/register rejects missing email or short password", async () => {
    const res1 = await request(app).post("/api/auth/register").send({ password: "123" });
    expect(res1.status).toBe(400);

    const res2 = await request(app).post("/api/auth/register").send({ email: "test@example.com", password: "123" });
    expect(res2.status).toBe(400);
  });

  it("POST /api/auth/login rejects missing credentials or wrong password", async () => {
    const res1 = await request(app).post("/api/auth/login").send({});
    expect(res1.status).toBe(400);

    const res2 = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "somepassword",
    });
    expect(res2.status).toBe(401);
  });
});
