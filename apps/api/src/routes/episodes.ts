import { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { getPagination, withArchivedFilter } from "./utils.js";

export async function registerEpisodesRoutes(app: FastifyInstance) {
  app.get("/api/episodes", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);
    const filters: string[] = [];
    const params: Array<string | number> = [];

    if (query.series) {
      params.push(query.series);
      filters.push(`s.slug = $${params.length}`);
    }
    if (query.country) {
      params.push(query.country);
      filters.push(`c.slug = $${params.length}`);
    }

    const where = withArchivedFilter(filters.length ? [filters.join(" AND ")] : []);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM episodes e
       JOIN episode_series s ON s.id = e.series_id
       JOIN countries c ON c.id = e.country_id
       WHERE ${where}`,
      params
    );

    const rows = await pool.query(
      `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at
       FROM episodes e
       JOIN episode_series s ON s.id = e.series_id
       JOIN countries c ON c.id = e.country_id
       WHERE ${where}
       ORDER BY e.global_order ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });

  app.get("/api/episodes/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const episodeResult = await pool.query(
      "SELECT id, slug, series_id, country_id, episode_number, global_order, title_native, title_ru, summary, content_markdown, reading_minutes, published_at FROM episodes WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const episode = episodeResult.rows[0];
    if (!episode) {
      reply.code(404);
      return { error: "Episode not found" };
    }

    const [series, country, characters, locations] = await Promise.all([
      pool.query("SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE id = $1", [episode.series_id]),
      pool.query("SELECT id, slug, title_ru, flag_emoji, flag_asset_path, flag_colors FROM countries WHERE id = $1", [episode.country_id]),
      pool.query(
        `SELECT c.id, c.slug, c.name_ru, c.name_native, c.description
         FROM characters c
         JOIN episode_characters ec ON ec.character_id = c.id
         WHERE ec.episode_id = $1 AND c.archived_at IS NULL
         ORDER BY c.name_ru ASC`,
        [episode.id]
      ),
      pool.query(
        `SELECT l.id, l.slug, l.title_ru, l.summary, l.country_id
         FROM locations l
         JOIN episode_locations el ON el.location_id = l.id
         WHERE el.episode_id = $1 AND l.archived_at IS NULL
         ORDER BY l.title_ru ASC`,
        [episode.id]
      )
    ]);

    return {
      episode,
      series: series.rows[0] ?? null,
      country: country.rows[0] ?? null,
      characters: characters.rows,
      locations: locations.rows
    };
  });
}
