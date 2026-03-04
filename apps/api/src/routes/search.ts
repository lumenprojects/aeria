import { FastifyInstance } from "fastify";
import Typesense from "typesense";
import { SearchGroupsDTO, SearchQueryDTO, SearchResultDTO } from "@aeria/shared";
import { errorPayload, parseQuery, validateResponse } from "./utils.js";

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
    const queryParams = parseQuery(reply, SearchQueryDTO, req.query);
    if (!queryParams) {
      return errorPayload("Invalid query parameters");
    }

    if (!typesenseClient) {
      reply.code(503);
      return errorPayload("Typesense is not configured");
    }

    const query = queryParams.q?.trim() ?? "";
    if (!query) {
      return validateResponse(SearchGroupsDTO, { groups: [] }, "/api/search:empty");
    }

    const searches = collections.map((collection) => ({
      collection: collection.name,
      q: query,
      query_by: "title,summary,body",
      per_page: 8
    }));

    const result = (await typesenseClient.multiSearch.perform({ searches }, {})) as {
      results: Array<{ hits?: Array<{ document: Record<string, unknown> }> }>;
    };

    const groups = result.results.map((group, index) => {
      const type = collections[index].type;
      const hits = (group.hits || []).map((hit) => {
        const doc = hit.document;
        return validateResponse(
          SearchResultDTO,
          {
            type,
            id: String(doc.id),
            slug: String(doc.slug),
            title: String(doc.title),
            summary: doc.summary ? String(doc.summary) : null,
            url: String(doc.url)
          },
          "/api/search:hit"
        );
      });
      return { type, hits };
    });

    return validateResponse(SearchGroupsDTO, { groups }, "/api/search");
  });
}
