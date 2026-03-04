import { FastifyInstance } from "fastify";
import {
  CountryDTO,
  LocationDTO,
  PaginatedCountriesResponseDTO,
  PaginatedLocationsResponseDTO,
  PaginationQueryDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import { errorPayload, parseQuery, validateResponse, withArchivedFilter } from "./utils.js";

export async function registerWorldRoutes(app: FastifyInstance) {
  app.get("/api/countries", async (req, reply) => {
    const query = parseQuery(reply, PaginationQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM countries WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, flag_emoji, flag_asset_path, flag_colors FROM countries WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        CountryDTO,
        {
          id: row.id,
          slug: row.slug,
          title_ru: row.title_ru,
          flag_emoji: row.flag_emoji ?? null,
          flag_asset_path: row.flag_asset_path ?? null,
          flag_colors: row.flag_colors ?? null
        },
        "/api/countries:item"
      )
    );

    return validateResponse(
      PaginatedCountriesResponseDTO,
      {
        items,
        total: Number(countResult.rows[0]?.count ?? 0),
        page,
        limit
      },
      "/api/countries"
    );
  });

  app.get("/api/locations", async (req, reply) => {
    const query = parseQuery(reply, PaginationQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM locations WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, country_id, summary, description_markdown, avatar_asset_path FROM locations WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        LocationDTO,
        {
          id: row.id,
          slug: row.slug,
          title_ru: row.title_ru,
          country_id: row.country_id ?? null,
          summary: row.summary ?? null,
          description_markdown: row.description_markdown ?? null,
          avatar_asset_path: row.avatar_asset_path ?? null
        },
        "/api/locations:item"
      )
    );

    return validateResponse(
      PaginatedLocationsResponseDTO,
      {
        items,
        total: Number(countResult.rows[0]?.count ?? 0),
        page,
        limit
      },
      "/api/locations"
    );
  });
}
