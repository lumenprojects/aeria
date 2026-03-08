import { FastifyInstance } from "fastify";
import {
  CountryFlagDTO,
  HomeAboutProfileDTO,
  HomeEpisodeParticipantDTO,
  HomeEpisodeSeriesDTO,
  HomeLatestEpisodeDTO,
  HomeSnapshotDTO,
  HomeWorldQuoteDTO,
  HomeWorldQuoteResponseDTO
} from "@aeria/shared";
import { z } from "zod";
import { pool } from "../db.js";
import { entityUrl, errorPayload, parseQuery, toNullableIsoDateTime, validateResponse } from "./utils.js";

const HomeWorldQuoteRandomQueryDTO = z.object({
  exclude_id: z.coerce.number().int().positive().optional()
});

async function selectRandomWorldQuote(excludeId?: number) {
  if (excludeId !== undefined) {
    const filteredResult = await pool.query(
      `SELECT id, quote, source
       FROM world_quotes
       WHERE archived_at IS NULL AND id <> $1
       ORDER BY RANDOM()
       LIMIT 1`,
      [excludeId]
    );
    if (filteredResult.rows[0]) {
      return filteredResult.rows[0];
    }
  }

  const fallbackResult = await pool.query(
    `SELECT id, quote, source
     FROM world_quotes
     WHERE archived_at IS NULL
     ORDER BY RANDOM()
     LIMIT 1`
  );
  return fallbackResult.rows[0] ?? null;
}

export async function registerHomeRoutes(app: FastifyInstance) {
  app.get("/api/home/world-quote/random", async (req, reply) => {
    const query = parseQuery(reply, HomeWorldQuoteRandomQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const worldQuoteRow = await selectRandomWorldQuote(query.exclude_id);
    const worldQuote = worldQuoteRow
      ? validateResponse(
          HomeWorldQuoteDTO,
          {
            id: Number(worldQuoteRow.id),
            quote: worldQuoteRow.quote,
            source: worldQuoteRow.source
          },
          "/api/home/world-quote/random:world_quote"
        )
      : null;

    return validateResponse(
      HomeWorldQuoteResponseDTO,
      {
        world_quote: worldQuote
      },
      "/api/home/world-quote/random"
    );
  });

  app.get("/api/home", async () => {
    const [latestEpisodeResult, aboutProfileResult, worldQuoteRow] = await Promise.all([
      pool.query(
        `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at,
                c.slug AS country_slug, c.title_ru AS country_title_ru, c.flag_colors AS country_flag_colors
         FROM episodes e
         JOIN countries c ON c.id = e.country_id
         WHERE e.archived_at IS NULL
         ORDER BY e.published_at DESC NULLS LAST, e.global_order DESC
         LIMIT 1`
      ),
      pool.query(
        `SELECT id, slug, name_ru, avatar_asset_path, home_intro_title, home_intro_markdown
         FROM characters
         WHERE archived_at IS NULL AND listed = FALSE AND home_featured = TRUE
         ORDER BY updated_at DESC
         LIMIT 1`
      ),
      selectRandomWorldQuote()
    ]);

    const episodeRow = latestEpisodeResult.rows[0];
    const latestEpisode = episodeRow
      ? await (async () => {
          const [seriesResult, participantsResult] = await Promise.all([
            pool.query(
              `SELECT id, slug, title_ru, brand_color
               FROM episode_series
               WHERE id = $1 AND archived_at IS NULL`,
              [episodeRow.series_id]
            ),
            pool.query(
              `SELECT c.id, c.slug, c.name_ru, c.avatar_asset_path
               FROM episode_characters ec
               JOIN characters c ON c.id = ec.character_id
               WHERE ec.episode_id = $1 AND c.archived_at IS NULL
               ORDER BY ec.sort_order ASC, c.name_ru ASC`,
              [episodeRow.id]
            )
          ]);

          const series = seriesResult.rows[0]
            ? validateResponse(
                HomeEpisodeSeriesDTO,
                {
                  id: seriesResult.rows[0].id,
                  slug: seriesResult.rows[0].slug,
                  url: entityUrl("episode_series", seriesResult.rows[0].slug),
                  title_ru: seriesResult.rows[0].title_ru,
                  brand_color: seriesResult.rows[0].brand_color ?? null
                },
                "/api/home:latest_episode:series"
              )
            : null;

          const participants = participantsResult.rows.map((row) =>
            validateResponse(
              HomeEpisodeParticipantDTO,
              {
                id: row.id,
                slug: row.slug,
                url: entityUrl("character", row.slug),
                name_ru: row.name_ru,
                avatar_asset_path: row.avatar_asset_path
              },
              "/api/home:latest_episode:participant"
            )
          );

          return validateResponse(
            HomeLatestEpisodeDTO,
            {
              id: episodeRow.id,
              slug: episodeRow.slug,
              url: entityUrl("episode", episodeRow.slug),
              episode_number: episodeRow.episode_number,
              global_order: episodeRow.global_order,
              title_native: episodeRow.title_native ?? null,
              title_ru: episodeRow.title_ru,
              summary: episodeRow.summary ?? null,
              reading_minutes: episodeRow.reading_minutes ?? null,
              published_at: toNullableIsoDateTime(episodeRow.published_at),
              country: validateResponse(
                CountryFlagDTO,
                {
                  id: episodeRow.country_id,
                  slug: episodeRow.country_slug,
                  url: entityUrl("country", episodeRow.country_slug),
                  title_ru: episodeRow.country_title_ru,
                  flag_colors: episodeRow.country_flag_colors ?? null
                },
                "/api/home:latest_episode:country"
              ),
              series,
              participants
            },
            "/api/home:latest_episode"
          );
        })()
      : null;

    const aboutRow = aboutProfileResult.rows[0];
    const aboutProfile = aboutRow
      ? validateResponse(
          HomeAboutProfileDTO,
          {
            id: aboutRow.id,
            slug: aboutRow.slug,
            url: entityUrl("character", aboutRow.slug),
            name_ru: aboutRow.name_ru,
            avatar_asset_path: aboutRow.avatar_asset_path,
            home_intro_title: aboutRow.home_intro_title,
            home_intro_markdown: aboutRow.home_intro_markdown
          },
          "/api/home:about_profile"
        )
      : null;

    const worldQuote = worldQuoteRow
      ? validateResponse(
          HomeWorldQuoteDTO,
          {
            id: Number(worldQuoteRow.id),
            quote: worldQuoteRow.quote,
            source: worldQuoteRow.source
          },
          "/api/home:world_quote"
        )
      : null;

    return validateResponse(
      HomeSnapshotDTO,
      { latest_episode: latestEpisode, about_profile: aboutProfile, world_quote: worldQuote },
      "/api/home"
    );
  });
}
