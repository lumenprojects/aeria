import { FastifyInstance } from "fastify";
import {
  CountryFlagDTO,
  CountryDTO,
  EpisodeCharacterLinkDTO,
  EpisodeDetailResponseDTO,
  EpisodeDTO,
  EpisodeListItemDTO,
  EpisodeLocationLinkDTO,
  EpisodeSeriesDTO,
  EpisodesListQueryDTO,
  PaginatedEpisodesResponseDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  errorPayload,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse,
  withArchivedFilter
} from "./utils.js";

export async function registerEpisodesRoutes(app: FastifyInstance) {
  app.get("/api/episodes", async (req, reply) => {
    const query = parseQuery(reply, EpisodesListQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
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
      `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at,
              c.slug AS country_slug, c.title_ru AS country_title_ru, c.flag_colors AS country_flag_colors
       FROM episodes e
       JOIN episode_series s ON s.id = e.series_id
       JOIN countries c ON c.id = e.country_id
       WHERE ${where}
       ORDER BY e.global_order ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const items = rows.rows.map((row) =>
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
          published_at: toNullableIsoDateTime(row.published_at),
          country: validateResponse(
            CountryFlagDTO,
            {
              id: row.country_id,
              slug: row.country_slug,
              title_ru: row.country_title_ru,
              flag_colors: row.country_flag_colors ?? null
            },
            "/api/episodes:item:country"
          )
        },
        "/api/episodes:item"
      )
    );

    return validateResponse(
      PaginatedEpisodesResponseDTO,
      { items, total: Number(countResult.rows[0]?.count ?? 0), page, limit },
      "/api/episodes"
    );
  });

  app.get("/api/episodes/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const episodeResult = await pool.query(
      "SELECT id, slug, series_id, country_id, episode_number, global_order, title_native, title_ru, summary, content_markdown, reading_minutes, published_at FROM episodes WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const episodeRow = episodeResult.rows[0];
    if (!episodeRow) {
      reply.code(404);
      return errorPayload("Episode not found");
    }

    const [series, country, characters, locations] = await Promise.all([
      pool.query("SELECT id, slug, title_ru, brand_color, summary FROM episode_series WHERE id = $1", [
        episodeRow.series_id
      ]),
      pool.query(
        "SELECT id, slug, title_ru, flag_emoji, flag_asset_path, flag_colors FROM countries WHERE id = $1",
        [episodeRow.country_id]
      ),
      pool.query(
        `SELECT c.id, c.slug, c.name_ru, c.name_native, c.description
         FROM characters c
         JOIN episode_characters ec ON ec.character_id = c.id
         WHERE ec.episode_id = $1 AND c.archived_at IS NULL
         ORDER BY c.name_ru ASC`,
        [episodeRow.id]
      ),
      pool.query(
        `SELECT l.id, l.slug, l.title_ru, l.summary, l.country_id
         FROM locations l
         JOIN episode_locations el ON el.location_id = l.id
         WHERE el.episode_id = $1 AND l.archived_at IS NULL
         ORDER BY l.title_ru ASC`,
        [episodeRow.id]
      )
    ]);

    const episode = validateResponse(
      EpisodeDTO,
      {
        id: episodeRow.id,
        slug: episodeRow.slug,
        series_id: episodeRow.series_id,
        country_id: episodeRow.country_id,
        episode_number: episodeRow.episode_number,
        global_order: episodeRow.global_order,
        title_native: episodeRow.title_native ?? null,
        title_ru: episodeRow.title_ru,
        summary: episodeRow.summary ?? null,
        content_markdown: episodeRow.content_markdown ?? null,
        reading_minutes: episodeRow.reading_minutes ?? null,
        published_at: toNullableIsoDateTime(episodeRow.published_at)
      },
      "/api/episodes/:slug:episode"
    );

    const seriesItem = series.rows[0]
      ? validateResponse(
          EpisodeSeriesDTO,
          {
            id: series.rows[0].id,
            slug: series.rows[0].slug,
            title_ru: series.rows[0].title_ru,
            brand_color: series.rows[0].brand_color ?? null,
            summary: series.rows[0].summary ?? null
          },
          "/api/episodes/:slug:series"
        )
      : null;

    const countryItem = country.rows[0]
      ? validateResponse(
          CountryDTO,
          {
            id: country.rows[0].id,
            slug: country.rows[0].slug,
            title_ru: country.rows[0].title_ru,
            flag_emoji: country.rows[0].flag_emoji ?? null,
            flag_asset_path: country.rows[0].flag_asset_path ?? null,
            flag_colors: country.rows[0].flag_colors ?? null
          },
          "/api/episodes/:slug:country"
        )
      : null;

    const characterItems = characters.rows.map((row) =>
      validateResponse(
        EpisodeCharacterLinkDTO,
        {
          id: row.id,
          slug: row.slug,
          name_ru: row.name_ru,
          name_native: row.name_native ?? null,
          description: row.description ?? null
        },
        "/api/episodes/:slug:character"
      )
    );

    const locationItems = locations.rows.map((row) =>
      validateResponse(
        EpisodeLocationLinkDTO,
        {
          id: row.id,
          slug: row.slug,
          title_ru: row.title_ru,
          summary: row.summary ?? null,
          country_id: row.country_id ?? null
        },
        "/api/episodes/:slug:location"
      )
    );

    return validateResponse(
      EpisodeDetailResponseDTO,
      {
        episode,
        series: seriesItem,
        country: countryItem,
        characters: characterItems,
        locations: locationItems
      },
      "/api/episodes/:slug"
    );
  });
}
