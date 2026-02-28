import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerEpisodesRoutes } from "./routes/episodes.js";
import { registerSeriesRoutes } from "./routes/series.js";
import { registerCharactersRoutes } from "./routes/characters.js";
import { registerAtlasRoutes } from "./routes/atlas.js";
import { registerWorldRoutes } from "./routes/world.js";
import { registerSearchRoutes } from "./routes/search.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? true
});

app.get("/health", async () => ({ ok: true }));

await registerEpisodesRoutes(app);
await registerSeriesRoutes(app);
await registerCharactersRoutes(app);
await registerAtlasRoutes(app);
await registerWorldRoutes(app);
await registerSearchRoutes(app);

const port = Number(process.env.API_PORT || 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
