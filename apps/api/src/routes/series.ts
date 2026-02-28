import { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { getPagination, withArchivedFilter } from "./utils.js";

export async function registerSeriesRoutes(app: FastifyInstance) {
  app.get("/api/series", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);

    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM episode_series WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });

  app.get("/api/series/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const seriesResult = await pool.query(
      "SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const series = seriesResult.rows[0];
    if (!series) {
      reply.code(404);
      return { error: "Series not found" };
    }

    const episodes = await pool.query(
      `SELECT id, slug, series_id, country_id, episode_number, global_order, title_native, title_ru, summary, reading_minutes, published_at
       FROM episodes WHERE series_id = $1 AND archived_at IS NULL ORDER BY episode_number ASC`,
      [series.id]
    );

    return { series, episodes: episodes.rows };
  });
}
