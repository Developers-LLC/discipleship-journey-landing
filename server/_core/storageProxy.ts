import type { Express } from "express";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Attempt Forge API if configured
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/presign/get",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        forgeUrl.searchParams.set("path", key);

        const forgeResp = await fetch(forgeUrl, {
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
        });

        if (forgeResp.ok) {
          const { url } = (await forgeResp.json()) as { url: string };
          if (url) {
            res.set("Cache-Control", "no-store");
            res.redirect(307, url);
            return;
          }
        }
      } catch (err) {
        console.warn("[StorageProxy] Forge API lookup failed, trying local fallback:", err);
      }
    }

    // Fallback: serve local artifact file from public/manus-storage or docs
    const possiblePaths = [
      path.resolve(process.cwd(), "client/public/manus-storage", key),
      path.resolve(process.cwd(), "dist/public/manus-storage", key),
      path.resolve(process.cwd(), "public/manus-storage", key),
      path.resolve(process.cwd(), "docs", key),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        return;
      }
    }

    res.status(404).send(`File non-existent: ${key}`);
  });
}
