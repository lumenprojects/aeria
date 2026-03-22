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
  entityUrl,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse,
  withArchivedFilter
} from "./utils.js";
import { toAtlasEntityReference, type AtlasEntityReferenceRow } from "./atlas-entity-helpers.js";

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
          url: entityUrl("episode_series", row.slug),
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
      `SELECT e.id, e.slug, e.series_id, e.country_entity_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at,
              c.id AS country_ref_id,
              c.slug AS country_ref_slug,
              c.type AS country_ref_type,
              c.title_ru AS country_ref_title_ru,
              c.summary AS country_ref_summary,
              c.avatar_asset_path AS country_ref_avatar_asset_path,
              c.flag_colors AS country_ref_flag_colors
       FROM episodes e
       JOIN atlas_entities c ON c.id = e.country_entity_id
       WHERE e.series_id = $1 AND e.archived_at IS NULL
       ORDER BY e.episode_number ASC`,
      [seriesRow.id]
    );

    const series = validateResponse(
      EpisodeSeriesDTO,
      {
        id: seriesRow.id,
        slug: seriesRow.slug,
        url: entityUrl("episode_series", seriesRow.slug),
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
          url: entityUrl("episode", row.slug),
          series_id: row.series_id,
          country_entity_id: row.country_entity_id,
          episode_number: row.episode_number,
          global_order: row.global_order,
          title_native: row.title_native ?? null,
          title_ru: row.title_ru,
          summary: row.summary ?? null,
          reading_minutes: row.reading_minutes ?? null,
          published_at: toNullableIsoDateTime(row.published_at),
          country: toAtlasEntityReference(
            {
              id: row.country_ref_id,
              slug: row.country_ref_slug,
              type: row.country_ref_type,
              title_ru: row.country_ref_title_ru,
              summary: row.country_ref_summary ?? null,
              avatar_asset_path: row.country_ref_avatar_asset_path ?? null,
              flag_colors: row.country_ref_flag_colors ?? null
            } as AtlasEntityReferenceRow,
            "/api/series/:slug:episode:country"
          )
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
