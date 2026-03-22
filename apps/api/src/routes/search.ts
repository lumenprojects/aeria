import { FastifyInstance } from "fastify";
import Typesense from "typesense";
import { SearchGroupsDTO, SearchQueryDTO, SearchResultDTO } from "@aeria/shared";
import { pool } from "../db.js";
import { entityUrl, errorPayload, parseQuery, validateResponse } from "./utils.js";

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
  { name: "atlas_entities", type: "atlas_entity" },
  { name: "episode_series", type: "episode_series" }
] as const;

async function searchFromDb(query: string) {
  const searchTerm = `%${query}%`;
  const [episodes, characters, atlasEntities, series] = await Promise.all([
    pool.query(
      `SELECT id::text AS id, slug, title_ru AS title, summary
       FROM episodes
       WHERE archived_at IS NULL
         AND (
           title_ru ILIKE $1
           OR COALESCE(summary, '') ILIKE $1
           OR COALESCE(content_markdown, '') ILIKE $1
         )
       ORDER BY published_at DESC NULLS LAST, global_order DESC
       LIMIT 8`,
      [searchTerm]
    ),
    pool.query(
      `SELECT id::text AS id, slug, name_ru AS title, tagline AS summary
       FROM characters
       WHERE archived_at IS NULL
         AND listed = TRUE
         AND (
           name_ru ILIKE $1
           OR COALESCE(tagline, '') ILIKE $1
           OR COALESCE(bio_markdown, '') ILIKE $1
         )
       ORDER BY name_ru ASC
       LIMIT 8`,
      [searchTerm]
    ),
    pool.query(
      `SELECT ae.id::text AS id,
              ae.slug,
              ae.title_ru AS title,
              ae.summary
       FROM atlas_entities ae
       LEFT JOIN LATERAL (
         SELECT STRING_AGG(COALESCE(section.summary, '') || ' ' || COALESCE(section.body_markdown, ''), ' ') AS body
         FROM atlas_entity_sections section
         WHERE section.atlas_entity_id = ae.id
       ) section_text ON TRUE
       WHERE ae.archived_at IS NULL
         AND (
           ae.title_ru ILIKE $1
           OR COALESCE(ae.summary, '') ILIKE $1
           OR COALESCE(ae.overview_markdown, '') ILIKE $1
           OR COALESCE(section_text.body, '') ILIKE $1
         )
       ORDER BY ae.title_ru ASC
       LIMIT 8`,
      [searchTerm]
    ),
    pool.query(
      `SELECT id::text AS id, slug, title_ru AS title, summary
       FROM episode_series
       WHERE archived_at IS NULL
         AND (
           title_ru ILIKE $1
           OR COALESCE(summary, '') ILIKE $1
         )
       ORDER BY title_ru ASC
       LIMIT 8`,
      [searchTerm]
    )
  ]);

  const rowsByType = {
    episode: episodes.rows,
    character: characters.rows,
    atlas_entity: atlasEntities.rows,
    episode_series: series.rows
  } as const;

  return collections.map((collection) => {
    const hits = rowsByType[collection.type].map((row) =>
      validateResponse(
        SearchResultDTO,
        {
          type: collection.type,
          id: String(row.id),
          slug: String(row.slug),
          title: String(row.title),
          summary: row.summary ? String(row.summary) : null,
          url: entityUrl(collection.type, String(row.slug))
        },
        "/api/search:fallback-hit"
      )
    );

    return { type: collection.type, hits };
  });
}

export async function registerSearchRoutes(app: FastifyInstance) {
  app.get("/api/search", async (req, reply) => {
    const queryParams = parseQuery(reply, SearchQueryDTO, req.query);
    if (!queryParams) {
      return errorPayload("Invalid query parameters");
    }

    const query = queryParams.q?.trim() ?? "";
    if (!query) {
      return validateResponse(SearchGroupsDTO, { groups: [] }, "/api/search:empty");
    }

    if (!typesenseClient) {
      const groups = await searchFromDb(query);
      return validateResponse(SearchGroupsDTO, { groups }, "/api/search:fallback-no-typesense");
    }

    const searches = collections.map((collection) => ({
      collection: collection.name,
      q: query,
      query_by: "title,summary,body",
      per_page: 8
    }));

    let result: {
      results: Array<{ hits?: Array<{ document: Record<string, unknown> }> }>;
    };
    try {
      result = (await typesenseClient.multiSearch.perform({ searches }, {})) as {
        results: Array<{ hits?: Array<{ document: Record<string, unknown> }> }>;
      };
    } catch (error) {
      req.log.warn({ err: error }, "Typesense search failed, fallback to PostgreSQL");
      const groups = await searchFromDb(query);
      return validateResponse(SearchGroupsDTO, { groups }, "/api/search:fallback");
    }

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
