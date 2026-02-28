import { FastifyInstance } from "fastify";
import Typesense from "typesense";

const typesenseClient = (() => {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_KEY;
  const port = Number(process.env.TYPESENSE_PORT || 8108);
  const protocol = process.env.TYPESENSE_PROTOCOL || "http";
  if (!host || !apiKey) return null;
  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 2
  });
})();

const collections = [
  { name: "episodes", type: "episode" },
  { name: "characters", type: "character" },
  { name: "atlas_entries", type: "atlas_entry" },
  { name: "episode_series", type: "episode_series" },
  { name: "countries", type: "country" },
  { name: "locations", type: "location" }
] as const;

export async function registerSearchRoutes(app: FastifyInstance) {
  app.get("/api/search", async (req, reply) => {
    if (!typesenseClient) {
      reply.code(503);
      return { error: "Typesense is not configured" };
    }

    const { q } = req.query as { q?: string };
    const query = q?.trim() ?? "";
    if (!query) {
      return { groups: [] };
    }

    const searches = collections.map((collection) => ({
      collection: collection.name,
      q: query,
      query_by: "title,summary,body",
      per_page: 8
    }));

    const result = await typesenseClient.multiSearch.perform({ searches }, {});

    const groups = result.results.map((group, index) => {
      const type = collections[index].type;
      const hits = (group.hits || []).map((hit) => {
        const doc = hit.document as any;
        return {
          type,
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          summary: doc.summary ?? null,
          url: doc.url
        };
      });
      return { type, hits };
    });

    return { groups };
  });
}
