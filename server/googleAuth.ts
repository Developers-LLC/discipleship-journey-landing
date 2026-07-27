import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerGoogleAuthRoutes(app: Express) {
  // Initiate Google OAuth 2.0 flow
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

    const nonce = crypto.randomUUID();
    const state = encodeOAuthState({ redirectUri, nonce });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(OAUTH_STATE_COOKIE, nonce, {
      ...cookieOptions,
      maxAge: 600000, // 10 minutes
    });

    if (clientId) {
      const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleAuthUrl.searchParams.set("client_id", clientId);
      googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
      googleAuthUrl.searchParams.set("response_type", "code");
      googleAuthUrl.searchParams.set("scope", "openid email profile");
      googleAuthUrl.searchParams.set("state", state);
      googleAuthUrl.searchParams.set("prompt", "select_account");

      res.redirect(302, googleAuthUrl.toString());
    } else {
      // Fall back to standard OAuth portal with provider=google
      const oauthPortalUrl = process.env.OAUTH_SERVER_URL || "https://oauth.manus.im";
      const appId = process.env.VITE_APP_ID || "discipleship-journey";
      const portalCallback = `${req.protocol}://${req.get("host")}/api/oauth/callback`;

      const portalUrl = new URL(`${oauthPortalUrl}/app-auth`);
      portalUrl.searchParams.set("appId", appId);
      portalUrl.searchParams.set("redirectUri", portalCallback);
      portalUrl.searchParams.set("state", state);
      portalUrl.searchParams.set("type", "signIn");
      portalUrl.searchParams.set("provider", "google");

      res.redirect(302, portalUrl.toString());
    }
  });

  // Handle Google OAuth 2.0 callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "Missing code or state parameter" });
      return;
    }

    // Verify CSRF state nonce
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "Invalid OAuth state nonce" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

      let googleUser: { sub: string; email?: string; name?: string; picture?: string };

      if (clientId && clientSecret) {
        // Direct Google OAuth 2.0 token exchange
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          console.error("[GoogleAuth] Token exchange failed:", errText);
          res.status(500).json({ error: "Google token exchange failed" });
          return;
        }

        const tokenData = await tokenRes.json();
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userinfoRes.ok) {
          res.status(500).json({ error: "Failed to fetch Google user profile" });
          return;
        }

        googleUser = await userinfoRes.json();
      } else {
        // Handled via standard OAuth portal
        const tokenResponse = await sdk.exchangeCodeForToken(code, state);
        const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
        googleUser = {
          sub: userInfo.openId,
          email: userInfo.email ?? undefined,
          name: userInfo.name ?? undefined,
        };
      }

      const openId = googleUser.sub.startsWith("google_") ? googleUser.sub : `google_${googleUser.sub}`;

      await db.upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      const tfa = user ? await db.getTwoFactorByUserId(user.id) : null;

      if (tfa?.isEnabled) {
        const pendingToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.createPendingTwoFactor({
          token: pendingToken,
          userId: user!.id,
          openId,
          userName: googleUser.name ?? null,
          expiresAt,
        });
        res.redirect(302, `/2fa-challenge?token=${pendingToken}`);
      } else {
        const sessionToken = await sdk.createSessionToken(openId, {
          name: googleUser.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, "/");
      }
    } catch (error) {
      console.error("[GoogleAuth] OAuth callback failed:", error);
      res.status(500).json({ error: "Google OAuth callback failed" });
    }
  });

  // Direct Google ID token verification (Google Identity Services GIS)
  app.post("/api/auth/google/token", async (req: Request, res: Response) => {
    const { credential } = req.body ?? {};

    if (!credential || typeof credential !== "string") {
      res.status(400).json({ error: "Missing credential token" });
      return;
    }

    try {
      // Verify Google ID token via Google TokenInfo API
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);

      if (!tokenInfoRes.ok) {
        res.status(401).json({ error: "Invalid Google ID token" });
        return;
      }

      const payload = await tokenInfoRes.json();
      const sub = payload.sub;
      const email = payload.email;
      const name = payload.name;

      if (!sub) {
        res.status(400).json({ error: "Google token payload missing user ID" });
        return;
      }

      const openId = `google_${sub}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email: email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user?.id,
          name: name || user?.name,
          email: email || user?.email,
          openId,
        },
      });
    } catch (error) {
      console.error("[GoogleAuth] Token verification failed:", error);
      res.status(500).json({ error: "Token verification failed" });
    }
  });
}
