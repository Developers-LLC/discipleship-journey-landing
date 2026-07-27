import { describe, expect, it } from "vitest";
import request from "supertest";
import { createExpressApp } from "./_core/app";

describe("Google Auth API Routes", () => {
  const app = createExpressApp();

  it("GET /api/auth/google redirects to OAuth endpoint and sets state cookie", async () => {
    const res = await request(app).get("/api/auth/google");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("GET /api/auth/google/callback rejects request missing code or state", async () => {
    const res = await request(app).get("/api/auth/google/callback");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Missing code or state parameter" });
  });

  it("GET /api/auth/google/callback rejects invalid state nonce", async () => {
    const res = await request(app).get("/api/auth/google/callback?code=testcode&state=invalidstate");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Invalid OAuth state nonce" });
  });

  it("POST /api/auth/google/token rejects missing credential payload", async () => {
    const res = await request(app).post("/api/auth/google/token").send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Missing credential token" });
  });
});
