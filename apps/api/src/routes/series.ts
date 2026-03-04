import { FastifyInstance } from "fastify";
import {
  EpisodeListItemDTO,
  EpisodeSeriesDTO,
  PaginatedSeriesResponseDTO,
  PaginationQueryDTO,
  SeriesDetailResponseDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  errorPayload,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse,
  withArchivedFilter
} from "./utils.js";

export async function registerSeriesRoutes(app: FastifyInstance) {
  app.get("/api/series", async (req, reply) => {
    const query = parseQuery(reply, PaginationQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM episode_series WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE ${where} ORDER BY title_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        EpisodeSeriesDTO,
        {
          id: row.id,
          slug: row.slug,
          title_ru: row.title_ru,
          brand_color: row.brand_color ?? null,
          summary: row.summary ?? null
        },
        "/api/series:item"
      )
    );

    return validateResponse(
      PaginatedSeriesResponseDTO,
      {
        items,
        total: Number(countResult.rows[0]?.count ?? 0),
        page,
        limit
      },
      "/api/series"
    );
  });

  app.get("/api/series/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const seriesResult = await pool.query(
      "SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const seriesRow = seriesResult.rows[0];
    if (!seriesRow) {
      reply.code(404);
      return errorPayload("Series not found");
    }

    const episodes = await pool.query(
      `SELECT id, slug, series_id, country_id, episode_number, global_order, title_native, title_ru, summary, reading_minutes, published_at
       FROM episodes WHERE series_id = $1 AND archived_at IS NULL ORDER BY episode_number ASC`,
      [seriesRow.id]
    );

    const series = validateResponse(
      EpisodeSeriesDTO,
      {
        id: seriesRow.id,
        slug: seriesRow.slug,
        title_ru: seriesRow.title_ru,
        brand_color: seriesRow.brand_color ?? null,
        summary: seriesRow.summary ?? null
      },
      "/api/series/:slug:series"
    );

    const episodeItems = episodes.rows.map((row) =>
      validateResponse(
        EpisodeListItemDTO,
        {
          id: row.id,
          slug: row.slug,
          series_id: row.series_id,
          country_id: row.country_id,
          episode_number: row.episode_number,
          global_order: row.global_order,
          title_native: row.title_native ?? null,
          title_ru: row.title_ru,
          summary: row.summary ?? null,
          reading_minutes: row.reading_minutes ?? null,
          published_at: toNullableIsoDateTime(row.published_at)
        },
        "/api/series/:slug:episode"
      )
    );

    return validateResponse(
      SeriesDetailResponseDTO,
      {
        series,
        episodes: episodeItems
      },
      "/api/series/:slug"
    );
  });
}
