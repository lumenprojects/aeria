import { FastifyInstance } from "fastify";
import {
  AtlasReferenceDTO,
  CharacterDTO,
  CharacterDetailResponseDTO,
  CharacterFactOfDayDTO,
  CharacterFactOfDayResponseDTO,
  CharacterFactPersonDTO,
  CharacterListItemDTO,
  CharacterPreviewDTO,
  CharactersListQueryDTO,
  CharacterQuirkDTO,
  CharacterRumorDTO,
  CountryFlagDTO,
  EpisodeListItemDTO,
  PaginatedCharactersResponseDTO
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  errorPayload,
  entityUrl,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse
} from "./utils.js";

export async function registerCharactersRoutes(app: FastifyInstance) {
  app.get("/api/characters", async (req, reply) => {
    const query = parseQuery(reply, CharactersListQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const q = query.q?.trim();
    const country = query.country?.trim();
    const affiliation = query.affiliation?.trim();
    const sort = query.sort ?? "name_asc";

    const whereClauses = ["ch.archived_at IS NULL", "ch.listed = TRUE"];
    const whereValues: unknown[] = [];

    if (q) {
      whereValues.push(`%${q}%`);
      const searchParam = `$${whereValues.length}`;
      whereClauses.push(`(
        ch.name_ru ILIKE ${searchParam}
        OR COALESCE(ch.name_native, '') ILIKE ${searchParam}
        OR COALESCE(ch.tagline, '') ILIKE ${searchParam}
        OR COALESCE(ch.bio_markdown, '') ILIKE ${searchParam}
        OR COALESCE(c.title_ru, '') ILIKE ${searchParam}
        OR COALESCE(a.title_ru, '') ILIKE ${searchParam}
        OR COALESCE(ch.gender, '') ILIKE ${searchParam}
        OR COALESCE(ch.race, '') ILIKE ${searchParam}
        OR COALESCE(ch.mbti, '') ILIKE ${searchParam}
        OR COALESCE(ch.favorite_food, '') ILIKE ${searchParam}
      )`);
    }

    if (country) {
      whereValues.push(country);
      whereClauses.push(`c.slug = $${whereValues.length}`);
    }

    if (affiliation) {
      whereValues.push(affiliation);
      whereClauses.push(`a.slug = $${whereValues.length}`);
    }

    const where = whereClauses.join(" AND ");
    const orderBy = sort === "name_desc" ? "ch.name_ru DESC" : "ch.name_ru ASC";

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM characters ch
       LEFT JOIN countries c ON c.id = ch.country_id AND c.archived_at IS NULL
       LEFT JOIN atlas_entries a ON a.id = ch.affiliation_id AND a.archived_at IS NULL
       WHERE ${where}`,
      whereValues
    );

    const listValues = [...whereValues, limit, offset];
    const rows = await pool.query(
      `SELECT ch.id, ch.slug, ch.name_ru, ch.name_native, ch.tagline, ch.avatar_asset_path,
              c.id AS country_id,
              c.slug AS country_slug,
              c.title_ru AS country_title_ru,
              c.flag_colors AS country_flag_colors,
              a.id AS affiliation_id,
              a.slug AS affiliation_slug,
              a.kind AS affiliation_kind,
              a.title_ru AS affiliation_title_ru,
              a.avatar_asset_path AS affiliation_avatar_asset_path
       FROM characters ch
       LEFT JOIN countries c ON c.id = ch.country_id AND c.archived_at IS NULL
       LEFT JOIN atlas_entries a ON a.id = ch.affiliation_id AND a.archived_at IS NULL
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT $${whereValues.length + 1} OFFSET $${whereValues.length + 2}`,
      listValues
    );

    const items = rows.rows.map((row) =>
      validateResponse(
        CharacterListItemDTO,
        {
          id: row.id,
          slug: row.slug,
          url: entityUrl("character", row.slug),
          name_ru: row.name_ru,
          name_native: row.name_native ?? null,
          tagline: row.tagline ?? null,
          avatar_asset_path: row.avatar_asset_path,
          country:
            row.country_id && row.country_slug && row.country_title_ru
              ? validateResponse(
                  CountryFlagDTO,
                  {
                    id: row.country_id,
                    slug: row.country_slug,
                    url: entityUrl("country", row.country_slug),
                    title_ru: row.country_title_ru,
                    flag_colors: row.country_flag_colors ?? null
                  },
                  "/api/characters:item:country"
                )
              : null,
          affiliation:
            row.affiliation_id && row.affiliation_slug && row.affiliation_kind && row.affiliation_title_ru
              ? validateResponse(
                  AtlasReferenceDTO,
                  {
                    id: row.affiliation_id,
                    slug: row.affiliation_slug,
                    url: entityUrl("atlas_entry", row.affiliation_slug),
                    kind: row.affiliation_kind,
                    title_ru: row.affiliation_title_ru,
                    avatar_asset_path: row.affiliation_avatar_asset_path ?? null
                  },
                  "/api/characters:item:affiliation"
                )
              : null
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

  app.get("/api/characters/fact-of-day", async () => {
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM character_facts f
       JOIN characters subject
         ON subject.id = f.subject_character_id
        AND subject.archived_at IS NULL
       WHERE f.archived_at IS NULL`
    );
    const total = Number(totalResult.rows[0]?.count ?? 0);
    if (total === 0) {
      return validateResponse(
        CharacterFactOfDayResponseDTO,
        {
          fact_of_day: null
        },
        "/api/characters/fact-of-day"
      );
    }

    const dayKeyResult = await pool.query(
      `SELECT FLOOR(EXTRACT(EPOCH FROM DATE_TRUNC('day', now() AT TIME ZONE 'Europe/Moscow')) / 86400)::bigint AS day_key`
    );
    const dayKey = Number(dayKeyResult.rows[0]?.day_key ?? 0);
    const offset = ((dayKey % total) + total) % total;

    const factResult = await pool.query(
      `SELECT f.id, f.fact_text, f.comment_text,
              subject.id AS subject_id,
              subject.slug AS subject_slug,
              subject.name_ru AS subject_name_ru,
              subject.avatar_asset_path AS subject_avatar_asset_path,
              author.id AS author_id,
              author.slug AS author_slug,
              author.name_ru AS author_name_ru,
              author.avatar_asset_path AS author_avatar_asset_path
       FROM character_facts f
       JOIN characters subject
         ON subject.id = f.subject_character_id
        AND subject.archived_at IS NULL
       LEFT JOIN characters author
         ON author.id = f.comment_author_character_id
        AND author.archived_at IS NULL
       WHERE f.archived_at IS NULL
       ORDER BY f.sort_order ASC, f.id ASC
       LIMIT 1 OFFSET $1`,
      [offset]
    );

    const factRow = factResult.rows[0];
    const factOfDay = factRow
      ? validateResponse(
          CharacterFactOfDayDTO,
          {
            id: Number(factRow.id),
            fact_text: factRow.fact_text,
            comment_text: factRow.comment_text,
            subject_character: validateResponse(
              CharacterFactPersonDTO,
              {
                id: factRow.subject_id,
                slug: factRow.subject_slug,
                url: entityUrl("character", factRow.subject_slug),
                name_ru: factRow.subject_name_ru,
                avatar_asset_path: factRow.subject_avatar_asset_path
              },
              "/api/characters/fact-of-day:subject_character"
            ),
            comment_author_character: factRow.author_id
              ? validateResponse(
                  CharacterFactPersonDTO,
                  {
                    id: factRow.author_id,
                    slug: factRow.author_slug,
                    url: entityUrl("character", factRow.author_slug),
                    name_ru: factRow.author_name_ru,
                    avatar_asset_path: factRow.author_avatar_asset_path
                  },
                  "/api/characters/fact-of-day:comment_author_character"
                )
              : null
          },
          "/api/characters/fact-of-day:fact_of_day"
        )
      : null;

    return validateResponse(
      CharacterFactOfDayResponseDTO,
      {
        fact_of_day: factOfDay
      },
      "/api/characters/fact-of-day"
    );
  });

  app.get("/api/characters/:slug/preview", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const characterResult = await pool.query(
      `SELECT id, slug, name_ru, avatar_asset_path, name_native, affiliation_id, country_id, tagline
       FROM characters
       WHERE slug = $1 AND archived_at IS NULL`,
      [slug]
    );
    const characterRow = characterResult.rows[0];
    if (!characterRow) {
      reply.code(404);
      return errorPayload("Character not found");
    }

    const [country, affiliation] = await Promise.all([
      characterRow.country_id
        ? pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [characterRow.country_id]
          )
        : Promise.resolve({ rows: [] }),
      characterRow.affiliation_id
        ? pool.query(
            "SELECT id, slug, kind, title_ru, avatar_asset_path FROM atlas_entries WHERE id = $1 AND archived_at IS NULL",
            [characterRow.affiliation_id]
          )
        : Promise.resolve({ rows: [] })
    ]);

    const countryItem = country.rows[0]
      ? validateResponse(
          CountryFlagDTO,
          {
            id: country.rows[0].id,
            slug: country.rows[0].slug,
            url: entityUrl("country", country.rows[0].slug),
            title_ru: country.rows[0].title_ru,
            flag_colors: country.rows[0].flag_colors ?? null
          },
          "/api/characters/:slug/preview:country"
        )
      : null;

    const affiliationItem = affiliation.rows[0]
      ? validateResponse(
          AtlasReferenceDTO,
          {
            id: affiliation.rows[0].id,
            slug: affiliation.rows[0].slug,
            url: entityUrl("atlas_entry", affiliation.rows[0].slug),
            kind: affiliation.rows[0].kind,
            title_ru: affiliation.rows[0].title_ru,
            avatar_asset_path: affiliation.rows[0].avatar_asset_path ?? null
          },
          "/api/characters/:slug/preview:affiliation"
        )
      : null;

    return validateResponse(
      CharacterPreviewDTO,
      {
        slug: characterRow.slug,
        url: entityUrl("character", characterRow.slug),
        name_ru: characterRow.name_ru,
        name_native: characterRow.name_native ?? null,
        avatar_asset_path: characterRow.avatar_asset_path,
        tagline: characterRow.tagline ?? null,
        country: countryItem,
        affiliation: affiliationItem
      },
      "/api/characters/:slug/preview"
    );
  });

  app.get("/api/characters/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const characterResult = await pool.query(
      `SELECT id, slug, name_ru, avatar_asset_path, name_native, affiliation_id, country_id, tagline,
              gender, race, height_cm, age, orientation, mbti, favorite_food, bio_markdown, published_at
       FROM characters
       WHERE slug = $1 AND archived_at IS NULL`,
      [slug]
    );
    const characterRow = characterResult.rows[0];
    if (!characterRow) {
      reply.code(404);
      return errorPayload("Character not found");
    }

    const [quirks, rumors, episodes, country, affiliation] = await Promise.all([
      pool.query(
        "SELECT text, sort_order FROM character_quirks WHERE character_id = $1 ORDER BY sort_order ASC",
        [characterRow.id]
      ),
      pool.query(
        `SELECT r.text, r.author_name, r.author_meta, r.source_type, r.source_id, r.sort_order,
                sc.slug AS source_character_slug,
                sc.name_ru AS source_character_title,
                sc.avatar_asset_path AS source_character_avatar_asset_path,
                sa.slug AS source_atlas_slug,
                sa.title_ru AS source_atlas_title,
                sa.avatar_asset_path AS source_atlas_avatar_asset_path
         FROM character_rumors r
         LEFT JOIN characters sc
           ON r.source_type = 'character' AND r.source_id = sc.id AND sc.archived_at IS NULL
         LEFT JOIN atlas_entries sa
           ON r.source_type = 'atlas_entry' AND r.source_id = sa.id AND sa.archived_at IS NULL
         WHERE r.character_id = $1
         ORDER BY r.sort_order ASC`,
        [characterRow.id]
      ),
      pool.query(
        `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at,
                c.slug AS country_slug, c.title_ru AS country_title_ru, c.flag_colors AS country_flag_colors
         FROM episodes e
         JOIN episode_characters ec ON ec.episode_id = e.id
         JOIN countries c ON c.id = e.country_id
         WHERE ec.character_id = $1 AND e.archived_at IS NULL
         ORDER BY e.global_order ASC`,
        [characterRow.id]
      ),
      characterRow.country_id
        ? pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [characterRow.country_id]
          )
        : Promise.resolve({ rows: [] }),
      characterRow.affiliation_id
        ? pool.query(
            "SELECT id, slug, kind, title_ru, avatar_asset_path FROM atlas_entries WHERE id = $1 AND archived_at IS NULL",
            [characterRow.affiliation_id]
          )
        : Promise.resolve({ rows: [] })
    ]);

    const character = validateResponse(
      CharacterDTO,
      {
        id: characterRow.id,
        slug: characterRow.slug,
        url: entityUrl("character", characterRow.slug),
        name_ru: characterRow.name_ru,
        avatar_asset_path: characterRow.avatar_asset_path,
        name_native: characterRow.name_native ?? null,
        affiliation_id: characterRow.affiliation_id ?? null,
        country_id: characterRow.country_id ?? null,
        tagline: characterRow.tagline ?? null,
        gender: characterRow.gender ?? null,
        race: characterRow.race ?? null,
        height_cm: characterRow.height_cm ?? null,
        age: characterRow.age ?? null,
        orientation: characterRow.orientation ?? null,
        mbti: characterRow.mbti ?? null,
        favorite_food: characterRow.favorite_food ?? null,
        bio_markdown: characterRow.bio_markdown ?? null,
        published_at: toNullableIsoDateTime(characterRow.published_at)
      },
      "/api/characters/:slug:character"
    );

    const quirkItems = quirks.rows.map((row) =>
      validateResponse(
        CharacterQuirkDTO,
        {
          text: row.text,
          sort_order: row.sort_order
        },
        "/api/characters/:slug:quirk"
      )
    );

    const rumorItems = rumors.rows.map((row) => {
      const source =
        row.source_type === "character" && row.source_character_slug
          ? {
              type: "character" as const,
              id: row.source_id,
              slug: row.source_character_slug,
              url: entityUrl("character", row.source_character_slug),
              title: row.source_character_title,
              avatar_asset_path: row.source_character_avatar_asset_path ?? null
            }
          : row.source_type === "atlas_entry" && row.source_atlas_slug
            ? {
                type: "atlas_entry" as const,
                id: row.source_id,
                slug: row.source_atlas_slug,
                url: entityUrl("atlas_entry", row.source_atlas_slug),
                title: row.source_atlas_title,
                avatar_asset_path: row.source_atlas_avatar_asset_path ?? null
              }
            : null;

      return validateResponse(
        CharacterRumorDTO,
        {
          text: row.text,
          author_name: row.author_name,
          author_meta: row.author_meta ?? null,
          source,
          sort_order: row.sort_order
        },
        "/api/characters/:slug:rumor"
      );
    });

    const episodeItems = episodes.rows.map((row) =>
      validateResponse(
        EpisodeListItemDTO,
        {
          id: row.id,
          slug: row.slug,
          url: entityUrl("episode", row.slug),
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
              url: entityUrl("country", row.country_slug),
              title_ru: row.country_title_ru,
              flag_colors: row.country_flag_colors ?? null
            },
            "/api/characters/:slug:episode:country"
          )
        },
        "/api/characters/:slug:episode"
      )
    );

    const countryItem = country.rows[0]
      ? validateResponse(
          CountryFlagDTO,
          {
            id: country.rows[0].id,
            slug: country.rows[0].slug,
            url: entityUrl("country", country.rows[0].slug),
            title_ru: country.rows[0].title_ru,
            flag_colors: country.rows[0].flag_colors ?? null
          },
          "/api/characters/:slug:country"
        )
      : null;

    const affiliationItem = affiliation.rows[0]
      ? validateResponse(
          AtlasReferenceDTO,
          {
            id: affiliation.rows[0].id,
            slug: affiliation.rows[0].slug,
            url: entityUrl("atlas_entry", affiliation.rows[0].slug),
            kind: affiliation.rows[0].kind,
            title_ru: affiliation.rows[0].title_ru,
            avatar_asset_path: affiliation.rows[0].avatar_asset_path ?? null
          },
          "/api/characters/:slug:affiliation"
        )
      : null;

    return validateResponse(
      CharacterDetailResponseDTO,
      {
        character,
        country: countryItem,
        affiliation: affiliationItem,
        quirks: quirkItems,
        rumors: rumorItems,
        episodes: episodeItems
      },
      "/api/characters/:slug"
    );
  });
}
