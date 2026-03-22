import { FastifyInstance } from "fastify";
import {
  AtlasCatalogItemDTO,
  AtlasCatalogQueryDTO,
  AtlasCatalogResponseDTO,
  AtlasDetailResponseDTO,
  AtlasEntitySectionDTO,
  AtlasFactDTO,
  AtlasPreviewDTO,
  AtlasQuoteCharacterDTO,
  AtlasQuoteDTO,
  AtlasResolvedRelationDTO,
  AtlasResolvedRelationTargetDTO,
  type AtlasEntityType,
  type AtlasQuoteSpeakerType,
  type AtlasSection,
  type EntityType
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  entityUrl,
  errorPayload,
  parseQuery,
  validateResponse
} from "./utils.js";
import {
  toAtlasEntity,
  toAtlasEntityReference,
  type AtlasEntityReferenceRow,
  type AtlasEntityRow
} from "./atlas-entity-helpers.js";

type CatalogRow = AtlasEntityRow & {
  sections: AtlasSection[];
  related_count: number | string;
  country_ref_id: string | null;
  country_ref_slug: string | null;
  country_ref_type: AtlasEntityType | null;
  country_ref_title_ru: string | null;
  country_ref_summary: string | null;
  country_ref_avatar_asset_path: string | null;
  country_ref_flag_colors: string[] | null;
  location_ref_id: string | null;
  location_ref_slug: string | null;
  location_ref_type: AtlasEntityType | null;
  location_ref_title_ru: string | null;
  location_ref_summary: string | null;
  location_ref_avatar_asset_path: string | null;
  location_ref_flag_colors: string[] | null;
};

type SectionRow = {
  section: AtlasSection;
  title_ru: string;
  summary: string | null;
  body_markdown: string | null;
  fact_title: string | null;
  fact_text: string | null;
  fact_meta: string | null;
};

type QuoteRow = {
  id: number | string;
  section: AtlasSection;
  speaker_type: AtlasQuoteSpeakerType;
  character_id: string | null;
  speaker_name: string | null;
  speaker_meta: string | null;
  text: string;
  sort_order: number | string;
};

type QuoteCharacterRow = {
  id: string;
  slug: string;
  name_ru: string;
  avatar_asset_path: string;
};

type RelationRow = {
  to_type: EntityType;
  to_id: string;
  label: string | null;
};

function normalizeCatalogSections(value: unknown): AtlasSection[] {
  const isAtlasSection = (candidate: string): candidate is AtlasSection => candidate in atlasSectionLabels;

  if (Array.isArray(value)) {
    return value.filter((item): item is AtlasSection => typeof item === "string" && isAtlasSection(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^\{/, "").replace(/\}$/, "");
    if (!trimmed) return [];
    return trimmed
      .split(",")
      .map((item) => item.trim().replace(/^"|"$/g, ""))
      .filter((item): item is AtlasSection => isAtlasSection(item));
  }

  return [];
}

const atlasSectionLabels: Record<AtlasSection, string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const atlasEntityTypeLabels: Record<AtlasEntityType, string> = {
  country: "Страны",
  location: "Локации",
  organization: "Организации",
  object: "Объекты",
  event: "События",
  belief: "Верования",
  concept: "Понятия",
  other: "Другое"
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function sortCatalogItems(
  items: Array<{
    title_ru: string;
    published_at: string | null;
  }>,
  sort: "title_asc" | "title_desc" | "recent"
) {
  if (sort === "recent") {
    return [...items].sort((a, b) => {
      const aTime = a.published_at ? Date.parse(a.published_at) : Number.NEGATIVE_INFINITY;
      const bTime = b.published_at ? Date.parse(b.published_at) : Number.NEGATIVE_INFINITY;
      if (aTime !== bTime) return bTime - aTime;
      return a.title_ru.localeCompare(b.title_ru, "ru");
    });
  }

  return [...items].sort((a, b) =>
    sort === "title_desc"
      ? b.title_ru.localeCompare(a.title_ru, "ru")
      : a.title_ru.localeCompare(b.title_ru, "ru")
  );
}

async function loadAtlasEntityReferenceById(id: string, routeId: string) {
  const result = await pool.query(
    `SELECT id, slug, type, title_ru, summary, avatar_asset_path, flag_colors
     FROM atlas_entities
     WHERE id = $1 AND archived_at IS NULL`,
    [id]
  );
  const row = result.rows[0] as AtlasEntityReferenceRow | undefined;
  return row ? toAtlasEntityReference(row, routeId) : null;
}

async function loadQuoteCharacterMap(rows: QuoteRow[]) {
  const characterIds = [...new Set(rows.map((row) => row.character_id).filter((value): value is string => Boolean(value)))];
  const characterMap = new Map<string, import("@aeria/shared").AtlasQuoteCharacterDTO>();
  if (characterIds.length === 0) return characterMap;

  const result = await pool.query(
    `SELECT id, slug, name_ru, avatar_asset_path
     FROM characters
     WHERE id = ANY($1)
       AND archived_at IS NULL`,
    [characterIds]
  );

  for (const row of result.rows as QuoteCharacterRow[]) {
    characterMap.set(
      row.id,
      validateResponse(
        AtlasQuoteCharacterDTO,
        {
          id: row.id,
          slug: row.slug,
          url: entityUrl("character", row.slug),
          name_ru: row.name_ru,
          avatar_asset_path: row.avatar_asset_path
        },
        "/api/atlas:quote-character"
      )
    );
  }

  return characterMap;
}

async function loadSections(atlasEntityId: string) {
  const [sectionResult, quoteResult] = await Promise.all([
    pool.query(
      `SELECT s.section, s.title_ru, s.summary, s.body_markdown,
              f.title AS fact_title, f.text AS fact_text, f.meta AS fact_meta
       FROM atlas_entity_sections s
       LEFT JOIN atlas_entity_facts f
         ON f.atlas_entity_id = s.atlas_entity_id
        AND f.section = s.section
       WHERE s.atlas_entity_id = $1
       ORDER BY s.sort_order ASC, s.id ASC`,
      [atlasEntityId]
    ),
    pool.query(
      `SELECT id, section, speaker_type, character_id, speaker_name, speaker_meta, text, sort_order
       FROM atlas_entity_quotes
       WHERE atlas_entity_id = $1
       ORDER BY section ASC, sort_order ASC, id ASC`,
      [atlasEntityId]
    )
  ]);

  const quoteRows = quoteResult.rows as QuoteRow[];
  const characterMap = await loadQuoteCharacterMap(quoteRows);
  const quotesBySection = new Map<AtlasSection, import("@aeria/shared").AtlasQuoteDTO[]>();

  for (const row of quoteRows) {
    const quote = validateResponse(
      AtlasQuoteDTO,
      {
        id: Number(row.id),
        text: row.text,
        sort_order: Number(row.sort_order),
        speaker_type: row.speaker_type,
        speaker_name:
          row.speaker_type === "character" && row.character_id
            ? characterMap.get(row.character_id)?.name_ru ?? "Неизвестный персонаж"
            : row.speaker_name ?? "Голос мира",
        speaker_meta: row.speaker_meta ?? null,
        character:
          row.speaker_type === "character" && row.character_id ? characterMap.get(row.character_id) ?? null : null
      },
      "/api/atlas:quote"
    );

    const bucket = quotesBySection.get(row.section) ?? [];
    bucket.push(quote);
    quotesBySection.set(row.section, bucket);
  }

  return (sectionResult.rows as SectionRow[]).map((row) =>
    validateResponse(
      AtlasEntitySectionDTO,
      {
        section: row.section,
        title_ru: row.title_ru,
        summary: row.summary ?? null,
        body_markdown: row.body_markdown ?? null,
        fact:
          row.fact_title && row.fact_text
            ? validateResponse(
                AtlasFactDTO,
                {
                  title: row.fact_title,
                  text: row.fact_text,
                  meta: row.fact_meta ?? null
                },
                "/api/atlas:section-fact"
              )
            : null,
        quotes: quotesBySection.get(row.section) ?? []
      },
      "/api/atlas:section"
    )
  );
}

async function resolveRelationTarget(type: EntityType, id: string) {
  switch (type) {
    case "character": {
      const result = await pool.query(
        `SELECT ch.id, ch.slug, ch.name_ru, ch.avatar_asset_path,
                c.id AS country_ref_id, c.slug AS country_ref_slug, c.type AS country_ref_type, c.title_ru AS country_ref_title_ru,
                c.summary AS country_ref_summary, c.avatar_asset_path AS country_ref_avatar_asset_path, c.flag_colors AS country_ref_flag_colors
         FROM characters ch
         LEFT JOIN atlas_entities c ON c.id = ch.country_entity_id AND c.archived_at IS NULL
         WHERE ch.id = $1 AND ch.archived_at IS NULL`,
        [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      return validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("character", row.slug),
          title: row.name_ru,
          avatar_asset_path: row.avatar_asset_path ?? null,
          country:
            row.country_ref_id
              ? toAtlasEntityReference(
                  {
                    id: row.country_ref_id,
                    slug: row.country_ref_slug,
                    type: row.country_ref_type,
                    title_ru: row.country_ref_title_ru,
                    summary: row.country_ref_summary ?? null,
                    avatar_asset_path: row.country_ref_avatar_asset_path ?? null,
                    flag_colors: row.country_ref_flag_colors ?? null
                  } as AtlasEntityReferenceRow,
                  "/api/atlas:relation-target:character-country"
                )
              : null
        },
        "/api/atlas:relation-target:character"
      );
    }
    case "atlas_entity": {
      const result = await pool.query(
        `SELECT ae.id, ae.slug, ae.title_ru, ae.avatar_asset_path,
                c.id AS country_ref_id, c.slug AS country_ref_slug, c.type AS country_ref_type, c.title_ru AS country_ref_title_ru,
                c.summary AS country_ref_summary, c.avatar_asset_path AS country_ref_avatar_asset_path, c.flag_colors AS country_ref_flag_colors
         FROM atlas_entities ae
         LEFT JOIN atlas_entities c ON c.id = ae.country_entity_id AND c.archived_at IS NULL
         WHERE ae.id = $1 AND ae.archived_at IS NULL`,
        [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      return validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("atlas_entity", row.slug),
          title: row.title_ru,
          avatar_asset_path: row.avatar_asset_path ?? null,
          country:
            row.country_ref_id
              ? toAtlasEntityReference(
                  {
                    id: row.country_ref_id,
                    slug: row.country_ref_slug,
                    type: row.country_ref_type,
                    title_ru: row.country_ref_title_ru,
                    summary: row.country_ref_summary ?? null,
                    avatar_asset_path: row.country_ref_avatar_asset_path ?? null,
                    flag_colors: row.country_ref_flag_colors ?? null
                  } as AtlasEntityReferenceRow,
                  "/api/atlas:relation-target:atlas-country"
                )
              : null
        },
        "/api/atlas:relation-target:atlas"
      );
    }
    case "episode": {
      const result = await pool.query(
        `SELECT e.id, e.slug, e.title_ru,
                c.id AS country_ref_id, c.slug AS country_ref_slug, c.type AS country_ref_type, c.title_ru AS country_ref_title_ru,
                c.summary AS country_ref_summary, c.avatar_asset_path AS country_ref_avatar_asset_path, c.flag_colors AS country_ref_flag_colors
         FROM episodes e
         LEFT JOIN atlas_entities c ON c.id = e.country_entity_id AND c.archived_at IS NULL
         WHERE e.id = $1 AND e.archived_at IS NULL`,
        [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      return validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("episode", row.slug),
          title: row.title_ru,
          avatar_asset_path: null,
          country:
            row.country_ref_id
              ? toAtlasEntityReference(
                  {
                    id: row.country_ref_id,
                    slug: row.country_ref_slug,
                    type: row.country_ref_type,
                    title_ru: row.country_ref_title_ru,
                    summary: row.country_ref_summary ?? null,
                    avatar_asset_path: row.country_ref_avatar_asset_path ?? null,
                    flag_colors: row.country_ref_flag_colors ?? null
                  } as AtlasEntityReferenceRow,
                  "/api/atlas:relation-target:episode-country"
                )
              : null
        },
        "/api/atlas:relation-target:episode"
      );
    }
    case "episode_series": {
      const result = await pool.query(
        "SELECT id, slug, title_ru FROM episode_series WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0];
      if (!row) return null;
      return validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("episode_series", row.slug),
          title: row.title_ru,
          avatar_asset_path: null,
          country: null
        },
        "/api/atlas:relation-target:series"
      );
    }
  }
}

async function resolveRelations(atlasEntityId: string) {
  const result = await pool.query(
    `SELECT to_type, to_id, label
     FROM atlas_entity_links
     WHERE from_atlas_entity_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [atlasEntityId]
  );

  const rows = result.rows as RelationRow[];
  const cache = new Map<string, Awaited<ReturnType<typeof resolveRelationTarget>>>();

  return Promise.all(
    rows.map(async (row) => {
      const cacheKey = `${row.to_type}:${row.to_id}`;
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, await resolveRelationTarget(row.to_type, row.to_id));
      }

      return validateResponse(
        AtlasResolvedRelationDTO,
        {
          from_type: "atlas_entity",
          from_id: atlasEntityId,
          to_type: row.to_type,
          to_id: row.to_id,
          label: row.label ?? null,
          target: cache.get(cacheKey) ?? null
        },
        "/api/atlas:relation"
      );
    })
  );
}

function buildCatalogCountry(row: CatalogRow) {
  return row.country_ref_id
    ? toAtlasEntityReference(
        {
          id: row.country_ref_id,
          slug: row.country_ref_slug ?? row.slug,
          type: row.country_ref_type ?? "country",
          title_ru: row.country_ref_title_ru ?? row.title_ru,
          summary: row.country_ref_summary ?? null,
          avatar_asset_path: row.country_ref_avatar_asset_path ?? null,
          flag_colors: row.country_ref_flag_colors ?? null
        },
        "/api/atlas:catalog:country"
      )
    : null;
}

function buildCatalogLocation(row: CatalogRow) {
  return row.location_ref_id
    ? toAtlasEntityReference(
        {
          id: row.location_ref_id,
          slug: row.location_ref_slug ?? row.slug,
          type: row.location_ref_type ?? "location",
          title_ru: row.location_ref_title_ru ?? row.title_ru,
          summary: row.location_ref_summary ?? null,
          avatar_asset_path: row.location_ref_avatar_asset_path ?? null,
          flag_colors: row.location_ref_flag_colors ?? null
        },
        "/api/atlas:catalog:location"
      )
    : null;
}

export async function registerAtlasRoutes(app: FastifyInstance) {
  app.get("/api/atlas/catalog", async (req, reply) => {
    const query = parseQuery(reply, AtlasCatalogQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const sort = query.sort ?? "title_asc";

    const result = await pool.query(
      `SELECT ae.id, ae.slug, ae.type, ae.title_ru, ae.summary, ae.overview_markdown, ae.avatar_asset_path, ae.flag_colors,
              ae.country_entity_id, ae.location_entity_id, ae.published_at,
              country.id AS country_ref_id, country.slug AS country_ref_slug, country.type AS country_ref_type, country.title_ru AS country_ref_title_ru,
              country.summary AS country_ref_summary, country.avatar_asset_path AS country_ref_avatar_asset_path, country.flag_colors AS country_ref_flag_colors,
              location.id AS location_ref_id, location.slug AS location_ref_slug, location.type AS location_ref_type, location.title_ru AS location_ref_title_ru,
              location.summary AS location_ref_summary, location.avatar_asset_path AS location_ref_avatar_asset_path, location.flag_colors AS location_ref_flag_colors,
              COALESCE(array_agg(DISTINCT section.section) FILTER (WHERE section.section IS NOT NULL), '{}') AS sections,
              COALESCE(link_counts.related_count, 0) AS related_count
       FROM atlas_entities ae
       LEFT JOIN atlas_entities country ON country.id = ae.country_entity_id AND country.archived_at IS NULL
       LEFT JOIN atlas_entities location ON location.id = ae.location_entity_id AND location.archived_at IS NULL
       LEFT JOIN atlas_entity_sections section ON section.atlas_entity_id = ae.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS related_count
         FROM atlas_entity_links
         WHERE from_atlas_entity_id = ae.id
       ) link_counts ON TRUE
       WHERE ae.archived_at IS NULL
       GROUP BY ae.id, country.id, location.id, link_counts.related_count
       ORDER BY ae.title_ru ASC`
    );

    const allItems = (result.rows as CatalogRow[]).map((row) => {
      const country = buildCatalogCountry(row);
      const location = buildCatalogLocation(row);
      const sections = normalizeCatalogSections(row.sections);
      const item = validateResponse(
        AtlasCatalogItemDTO,
        {
          id: row.id,
          slug: row.slug,
          url: entityUrl("atlas_entity", row.slug),
          type: row.type,
          title_ru: row.title_ru,
          summary: row.summary ?? null,
          avatar_asset_path: row.avatar_asset_path ?? null,
          flag_colors: row.flag_colors ?? null,
          sections,
          country,
          location,
          related_count: Number(row.related_count),
          published_at: row.published_at ? new Date(row.published_at).toISOString() : null
        },
        "/api/atlas:catalog:item"
      );

      const locationFilterSlug = item.location?.slug ?? (item.type === "location" ? item.slug : null);
      const searchText = [
        item.title_ru,
        item.summary ?? "",
        row.overview_markdown ?? "",
        country?.title_ru ?? "",
        location?.title_ru ?? "",
        sections.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      return { item, searchText, locationFilterSlug };
    }).filter(({ item, searchText, locationFilterSlug }) => {
      if (query.type && item.type !== query.type) return false;
      if (query.section && !item.sections.includes(query.section)) return false;
      if (query.country && item.country?.slug !== query.country) return false;
      if (query.location && locationFilterSlug !== query.location) return false;
      if (query.q && !searchText.includes(normalizeText(query.q))) return false;
      return true;
    });

    const filteredItems = allItems.map(({ item }) => item);
    const sortedItems = sortCatalogItems(filteredItems, sort);
    const offset = (page - 1) * limit;
    const pagedItems = sortedItems.slice(offset, offset + limit);

    const countryFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();
    const locationFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();

    for (const item of filteredItems) {
      if (item.country) {
        const current = countryFacetMap.get(item.country.slug);
        if (current) current.count += 1;
        else {
          countryFacetMap.set(item.country.slug, {
            id: item.country.id,
            slug: item.country.slug,
            title_ru: item.country.title_ru,
            count: 1
          });
        }
      }

      const location = item.location ?? (item.type === "location" ? item : null);
      if (location) {
        const current = locationFacetMap.get(location.slug);
        if (current) current.count += 1;
        else {
          locationFacetMap.set(location.slug, {
            id: location.id,
            slug: location.slug,
            title_ru: location.title_ru,
            count: 1
          });
        }
      }
    }

    return validateResponse(
      AtlasCatalogResponseDTO,
      {
        items: pagedItems,
        facets: {
          type: Object.entries(atlasEntityTypeLabels).map(([value, label]) => ({
            value,
            label,
            count: filteredItems.filter((item) => item.type === value).length
          })),
          section: Object.entries(atlasSectionLabels).map(([value, label]) => ({
            value,
            label,
            count: filteredItems.filter((item) => item.sections.includes(value as AtlasSection)).length
          })),
          country: [...countryFacetMap.values()].sort((a, b) => a.title_ru.localeCompare(b.title_ru, "ru")),
          location: [...locationFacetMap.values()].sort((a, b) => a.title_ru.localeCompare(b.title_ru, "ru"))
        },
        total: filteredItems.length,
        page,
        limit
      },
      "/api/atlas/catalog"
    );
  });

  app.get("/api/atlas/:slug/preview", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const result = await pool.query(
      `SELECT id, slug, type, title_ru, summary, overview_markdown, avatar_asset_path, flag_colors, country_entity_id, location_entity_id, published_at
       FROM atlas_entities
       WHERE slug = $1 AND archived_at IS NULL`,
      [slug]
    );
    const row = result.rows[0] as AtlasEntityRow | undefined;
    if (!row) {
      reply.code(404);
      return errorPayload("Atlas entry not found");
    }

    const [country, location, sections] = await Promise.all([
      row.country_entity_id ? loadAtlasEntityReferenceById(row.country_entity_id, "/api/atlas/:slug/preview:country") : Promise.resolve(null),
      row.location_entity_id ? loadAtlasEntityReferenceById(row.location_entity_id, "/api/atlas/:slug/preview:location") : Promise.resolve(null),
      pool.query(
        "SELECT section FROM atlas_entity_sections WHERE atlas_entity_id = $1 ORDER BY sort_order ASC, id ASC",
        [row.id]
      )
    ]);

    return validateResponse(
      AtlasPreviewDTO,
      {
        id: row.id,
        slug: row.slug,
        url: entityUrl("atlas_entity", row.slug),
        type: row.type,
        title_ru: row.title_ru,
        summary: row.summary ?? null,
        avatar_asset_path: row.avatar_asset_path ?? null,
        flag_colors: row.flag_colors ?? null,
        sections: sections.rows.map((item) => item.section),
        country,
        location
      },
      "/api/atlas/:slug/preview"
    );
  });

  app.get("/api/atlas/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const result = await pool.query(
      `SELECT id, slug, type, title_ru, summary, overview_markdown, avatar_asset_path, flag_colors, country_entity_id, location_entity_id, published_at
       FROM atlas_entities
       WHERE slug = $1 AND archived_at IS NULL`,
      [slug]
    );
    const row = result.rows[0] as AtlasEntityRow | undefined;
    if (!row) {
      reply.code(404);
      return errorPayload("Atlas entry not found");
    }

    const [country, location, sections, relations] = await Promise.all([
      row.country_entity_id ? loadAtlasEntityReferenceById(row.country_entity_id, "/api/atlas/:slug:country") : Promise.resolve(null),
      row.location_entity_id ? loadAtlasEntityReferenceById(row.location_entity_id, "/api/atlas/:slug:location") : Promise.resolve(null),
      loadSections(row.id),
      resolveRelations(row.id)
    ]);

    return validateResponse(
      AtlasDetailResponseDTO,
      {
        entity: toAtlasEntity(row, country, location, "/api/atlas/:slug:entity"),
        sections,
        relations
      },
      "/api/atlas/:slug"
    );
  });
}
