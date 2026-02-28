import { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { getPagination, withArchivedFilter } from "./utils.js";

export async function registerWorldRoutes(app: FastifyInstance) {
  app.get("/api/countries", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);
    const where = withArchivedFilter([]);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM countries WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, flag_emoji, flag_asset_path, flag_colors FROM countries WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });

  app.get("/api/locations", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);
    const where = withArchivedFilter([]);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM locations WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, country_id, summary, description_markdown FROM locations WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });
}
