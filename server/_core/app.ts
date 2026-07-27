import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "../stripe";

export function createExpressApp() {
  const app = express();

  // ── Stripe webhook — MUST be registered BEFORE express.json() ──
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      if (!sig || typeof sig !== "string") {
        res.status(400).json({ error: "Missing stripe-signature header" });
        return;
      }
      try {
        const result = await handleStripeWebhook(req.body as Buffer, sig);
        res.json(result);
      } catch (err) {
        console.error("[Stripe] Webhook error:", err);
        res.status(400).json({ error: "Webhook error" });
      }
    }
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerGoogleAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  return app;
}
