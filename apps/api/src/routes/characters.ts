import { FastifyInstance } from "fastify";
import {
  CharacterDTO,
  CharacterDetailResponseDTO,
  CharacterListItemDTO,
  CharacterTraitDTO,
  EpisodeListItemDTO,
  PaginatedCharactersResponseDTO,
  PaginationQueryDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  errorPayload,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse,
  withArchivedFilter
} from "./utils.js";

export async function registerCharactersRoutes(app: FastifyInstance) {
  app.get("/api/characters", async (req, reply) => {
    const query = parseQuery(reply, PaginationQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM characters WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, name_ru, name_native, description FROM characters WHERE ${where} ORDER BY name_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        CharacterListItemDTO,
        {
          id: row.id,
          slug: row.slug,
          name_ru: row.name_ru,
          name_native: row.name_native ?? null,
          description: row.description ?? null
        },
        "/api/characters:item"
      )
    );

    return validateResponse(
      PaginatedCharactersResponseDTO,
      {
        items,
        total: Number(countResult.rows[0]?.count ?? 0),
        page,
        limit
      },
      "/api/characters"
    );
  });

  app.get("/api/characters/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const characterResult = await pool.query(
      "SELECT id, slug, name_ru, name_native, affiliation_id, gender, race, height_cm, age, birth_country_id, favorite_food, orientation, description, quote, bio_markdown, stats, published_at FROM characters WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const characterRow = characterResult.rows[0];
    if (!characterRow) {
      reply.code(404);
      return errorPayload("Character not found");
    }

    const [traits, rumors, episodes] = await Promise.all([
      pool.query(
        "SELECT text, sort_order FROM character_traits WHERE character_id = $1 ORDER BY sort_order ASC",
        [characterRow.id]
      ),
      pool.query(
        "SELECT text, sort_order FROM character_rumors WHERE character_id = $1 ORDER BY sort_order ASC",
        [characterRow.id]
      ),
      pool.query(
        `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at
         FROM episodes e
         JOIN episode_characters ec ON ec.episode_id = e.id
         WHERE ec.character_id = $1 AND e.archived_at IS NULL
         ORDER BY e.global_order ASC`,
        [characterRow.id]
      )
    ]);

    const character = validateResponse(
      CharacterDTO,
      {
        id: characterRow.id,
        slug: characterRow.slug,
        name_ru: characterRow.name_ru,
        name_native: characterRow.name_native ?? null,
        affiliation_id: characterRow.affiliation_id ?? null,
        gender: characterRow.gender ?? null,
        race: characterRow.race ?? null,
        height_cm: characterRow.height_cm ?? null,
        age: characterRow.age ?? null,
        birth_country_id: characterRow.birth_country_id ?? null,
        favorite_food: characterRow.favorite_food ?? null,
        orientation: characterRow.orientation ?? null,
        description: characterRow.description ?? null,
        quote: characterRow.quote ?? null,
        bio_markdown: characterRow.bio_markdown ?? null,
        stats: characterRow.stats ?? null,
        published_at: toNullableIsoDateTime(characterRow.published_at)
      },
      "/api/characters/:slug:character"
    );

    const traitItems = traits.rows.map((row) =>
      validateResponse(
        CharacterTraitDTO,
        {
          text: row.text,
          sort_order: row.sort_order
        },
        "/api/characters/:slug:trait"
      )
    );

    const rumorItems = rumors.rows.map((row) =>
      validateResponse(
        CharacterTraitDTO,
        {
          text: row.text,
          sort_order: row.sort_order
        },
        "/api/characters/:slug:rumor"
      )
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
        "/api/characters/:slug:episode"
      )
    );

    return validateResponse(
      CharacterDetailResponseDTO,
      {
        character,
        traits: traitItems,
        rumors: rumorItems,
        episodes: episodeItems
      },
      "/api/characters/:slug"
    );
  });
}
