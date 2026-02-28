import { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { getPagination, withArchivedFilter } from "./utils.js";

export async function registerAtlasRoutes(app: FastifyInstance) {
  app.get("/api/atlas", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);

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

    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });

  app.get("/api/atlas/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const entryResult = await pool.query(
      "SELECT id, slug, kind, title_ru, summary, content_markdown, country_id, location_id, published_at FROM atlas_entries WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const entry = entryResult.rows[0];
    if (!entry) {
      const countryResult = await pool.query(
        "SELECT * FROM countries WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const country = countryResult.rows[0];
      if (country) {
        return {
          entry: {
            id: country.id,
            slug: country.slug,
            kind: "geography",
            title_ru: country.title_ru,
            summary: null,
            content_markdown: null,
            country_id: country.id,
            location_id: null
          },
          links: []
        };
      }
      const locationResult = await pool.query(
        "SELECT * FROM locations WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const location = locationResult.rows[0];
      if (location) {
        return {
          entry: {
            id: location.id,
            slug: location.slug,
            kind: "geography",
            title_ru: location.title_ru,
            summary: location.summary,
            content_markdown: location.description_markdown,
            country_id: location.country_id,
            location_id: location.id
          },
          links: []
        };
      }
      reply.code(404);
      return { error: "Atlas entry not found" };
    }

    const links = await pool.query(
      "SELECT from_type, from_id, to_type, to_id, label FROM atlas_links WHERE from_type = 'atlas_entry' AND from_id = $1",
      [entry.id]
    );

    return { entry, links: links.rows };
  });
}
