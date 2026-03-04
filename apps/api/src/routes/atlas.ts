import { FastifyInstance } from "fastify";
import {
  AtlasDetailResponseDTO,
  AtlasEntryDTO,
  AtlasListItemDTO,
  AtlasLinkDTO,
  AtlasListQueryDTO,
  PaginatedAtlasResponseDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import { errorPayload, parseQuery, toNullableIsoDateTime, validateResponse, withArchivedFilter } from "./utils.js";

export async function registerAtlasRoutes(app: FastifyInstance) {
  app.get("/api/atlas", async (req, reply) => {
    const query = parseQuery(reply, AtlasListQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (query.kind) {
      params.push(query.kind);
      filters.push(`kind = $${params.length}`);
    }

    const where = withArchivedFilter(filters.length ? [filters.join(" AND ")] : []);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM atlas_entries WHERE ${where}`,
      params
    );
    const rows = await pool.query(
      `SELECT id, slug, kind, title_ru, summary, country_id, location_id
       FROM atlas_entries WHERE ${where} ORDER BY title_ru ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        AtlasListItemDTO,
        {
          id: row.id,
          slug: row.slug,
          kind: row.kind,
          title_ru: row.title_ru,
          summary: row.summary ?? null,
          country_id: row.country_id ?? null,
          location_id: row.location_id ?? null
        },
        "/api/atlas:item"
      )
    );

    return validateResponse(
      PaginatedAtlasResponseDTO,
      {
        items,
        total: Number(countResult.rows[0]?.count ?? 0),
        page,
        limit
      },
      "/api/atlas"
    );
  });

  app.get("/api/atlas/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const entryResult = await pool.query(
      "SELECT id, slug, kind, title_ru, summary, content_markdown, country_id, location_id, published_at FROM atlas_entries WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const entryRow = entryResult.rows[0];

    if (!entryRow) {
      const countryResult = await pool.query(
        "SELECT id, slug, title_ru FROM countries WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const country = countryResult.rows[0];
      if (country) {
        return validateResponse(
          AtlasDetailResponseDTO,
          {
            entry: {
              id: country.id,
              slug: country.slug,
              kind: "geography",
              title_ru: country.title_ru,
              summary: null,
              content_markdown: null,
              country_id: country.id,
              location_id: null,
              published_at: null
            },
            links: []
          },
          "/api/atlas/:slug:fallback-country"
        );
      }

      const locationResult = await pool.query(
        "SELECT id, slug, title_ru, summary, description_markdown, country_id FROM locations WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const location = locationResult.rows[0];
      if (location) {
        return validateResponse(
          AtlasDetailResponseDTO,
          {
            entry: {
              id: location.id,
              slug: location.slug,
              kind: "geography",
              title_ru: location.title_ru,
              summary: location.summary ?? null,
              content_markdown: location.description_markdown ?? null,
              country_id: location.country_id ?? null,
              location_id: location.id,
              published_at: null
            },
            links: []
          },
          "/api/atlas/:slug:fallback-location"
        );
      }

      reply.code(404);
      return errorPayload("Atlas entry not found");
    }

    const links = await pool.query(
      "SELECT from_type, from_id, to_type, to_id, label FROM atlas_links WHERE from_type = 'atlas_entry' AND from_id = $1",
      [entryRow.id]
    );

    const entry = validateResponse(
      AtlasEntryDTO,
      {
        id: entryRow.id,
        slug: entryRow.slug,
        kind: entryRow.kind,
        title_ru: entryRow.title_ru,
        summary: entryRow.summary ?? null,
        content_markdown: entryRow.content_markdown ?? null,
        country_id: entryRow.country_id ?? null,
        location_id: entryRow.location_id ?? null,
        published_at: toNullableIsoDateTime(entryRow.published_at)
      },
      "/api/atlas/:slug:entry"
    );

    const linkItems = links.rows.map((row) =>
      validateResponse(
        AtlasLinkDTO,
        {
          from_type: row.from_type,
          from_id: row.from_id,
          to_type: row.to_type,
          to_id: row.to_id,
          label: row.label ?? null
        },
        "/api/atlas/:slug:link"
      )
    );

    return validateResponse(
      AtlasDetailResponseDTO,
      { entry, links: linkItems },
      "/api/atlas/:slug"
    );
  });
}
