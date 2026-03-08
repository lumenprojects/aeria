import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerHomeRoutes } from "./routes/home.js";
import { registerEpisodesRoutes } from "./routes/episodes.js";
import { registerSeriesRoutes } from "./routes/series.js";
import { registerCharactersRoutes } from "./routes/characters.js";
import { registerAtlasRoutes } from "./routes/atlas.js";
import { registerWorldRoutes } from "./routes/world.js";
import { registerSearchRoutes } from "./routes/search.js";
import { pool } from "./db.js";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const normalizeOrigin = (origin: string) => origin.trim().toLowerCase().replace(/\/$/, "");
  const configuredOrigins = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
  const allowedLoopbackOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);

  await app.register(cors, {
    origin:
      configuredOrigins.length > 0
        ? (origin, callback) => {
            if (!origin) {
              callback(null, true);
              return;
            }

            const normalizedOrigin = normalizeOrigin(origin);
            if (
              configuredOrigins.includes(normalizedOrigin) ||
              allowedLoopbackOrigins.has(normalizedOrigin)
            ) {
              callback(null, true);
              return;
            }

            callback(new Error("Origin not allowed"), false);
          }
        : true
  });

  app.get("/health", async () => ({ ok: true }));

  await registerHomeRoutes(app);
  await registerEpisodesRoutes(app);
  await registerSeriesRoutes(app);
  await registerCharactersRoutes(app);
  await registerAtlasRoutes(app);
  await registerWorldRoutes(app);
  await registerSearchRoutes(app);

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}
