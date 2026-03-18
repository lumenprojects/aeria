import { FastifyInstance } from "fastify";
import {
  AtlasCatalogQueryDTO,
  AtlasCatalogResponseDTO,
  AtlasDetailResponseDTO,
  AtlasEntryDTO,
  AtlasFactDTO,
  AtlasPreviewDTO,
  AtlasQuoteCharacterDTO,
  AtlasQuoteDTO,
  AtlasResolvedRelationDTO,
  AtlasResolvedRelationTargetDTO,
  CountryFlagDTO,
  LocationReferenceDTO,
  WorldNodeListItemDTO,
  type AtlasQuoteSpeakerType,
  type WorldNodeAnchorMode,
  type WorldNodeType
} from "@aeria/shared";
import { pool } from "../db.js";
import {
  entityUrl,
  errorPayload,
  parseQuery,
  toNullableIsoDateTime,
  validateResponse
} from "./utils.js";

type CountryRow = {
  id: string;
  slug: string;
  title_ru: string;
  flag_colors: string[] | null;
};

type AtlasEntryData = import("@aeria/shared").AtlasEntryDTO;
type AtlasResolvedRelationTargetData = import("@aeria/shared").AtlasResolvedRelationTargetDTO;
type EntityType = import("@aeria/shared").EntityType;
type LocationReferenceData = import("@aeria/shared").LocationReferenceDTO;
type AtlasQuoteCharacterData = import("@aeria/shared").AtlasQuoteCharacterDTO;

type LocationRow = {
  id: string;
  slug: string;
  title_ru: string;
  summary: string | null;
  description_markdown?: string | null;
  avatar_asset_path: string | null;
  country_id: string | null;
};

type AtlasEntryRow = {
  id: string;
  slug: string;
  kind: AtlasEntryData["kind"];
  title_ru: string;
  summary: string | null;
  content_markdown?: string | null;
  avatar_asset_path: string | null;
  country_id: string | null;
  location_id: string | null;
  published_at: Date | string | null;
};

type AtlasLinkRow = {
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  label: string | null;
};

type AtlasFactRow = {
  title: string;
  text: string;
  meta: string | null;
};

type AtlasQuoteRow = {
  id: number | string;
  speaker_type: AtlasQuoteSpeakerType;
  character_id: string | null;
  speaker_name: string | null;
  speaker_meta: string | null;
  text: string;
  sort_order: number | string;
};

type AtlasQuoteCharacterRow = {
  id: string;
  slug: string;
  name_ru: string;
  avatar_asset_path: string;
};

const atlasKindLabels: Record<AtlasEntryData["kind"], string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const entityLabels: Record<WorldNodeType, string> = {
  country: "Страны",
  location: "Локации",
  atlas_entry: "Записи атласа"
};

const anchorLabels: Record<WorldNodeAnchorMode, string> = {
  country: "Страна",
  location: "Локация",
  free: "Свободные"
};

function toCountryFlag(row: CountryRow, routeId: string) {
  return validateResponse(
    CountryFlagDTO,
    {
      id: row.id,
      slug: row.slug,
      url: entityUrl("country", row.slug),
      title_ru: row.title_ru,
      flag_colors: row.flag_colors ?? null
    },
    routeId
  );
}

function toLocationReference(row: LocationRow, country: CountryRow | null, routeId: string) {
  return validateResponse(
    LocationReferenceDTO,
    {
      id: row.id,
      slug: row.slug,
      url: entityUrl("location", row.slug),
      title_ru: row.title_ru,
      avatar_asset_path: row.avatar_asset_path ?? null,
      country: country ? toCountryFlag(country, `${routeId}:country`) : null
    },
    routeId
  );
}

function toAtlasFact(row: AtlasFactRow, routeId: string) {
  return validateResponse(
    AtlasFactDTO,
    {
      title: row.title,
      text: row.text,
      meta: row.meta ?? null
    },
    routeId
  );
}

function toAtlasQuoteCharacter(row: AtlasQuoteCharacterRow, routeId: string) {
  return validateResponse(
    AtlasQuoteCharacterDTO,
    {
      id: row.id,
      slug: row.slug,
      url: entityUrl("character", row.slug),
      name_ru: row.name_ru,
      avatar_asset_path: row.avatar_asset_path
    },
    routeId
  );
}

function supportsAtlasQuotes(nodeType: WorldNodeType, kind: AtlasEntryData["kind"]) {
  if (nodeType === "country") return false;
  if (nodeType === "location") return true;
  return kind !== "geography";
}

async function loadAtlasFact(nodeType: WorldNodeType, nodeId: string) {
  const result = await pool.query(
    "SELECT title, text, meta FROM atlas_facts WHERE node_type = $1 AND node_id = $2",
    [nodeType, nodeId]
  );
  const row = result.rows[0] as AtlasFactRow | undefined;
  return row ? toAtlasFact(row, "/api/atlas:fact") : null;
}

async function loadAtlasQuotes(nodeType: WorldNodeType, nodeId: string) {
  const result = await pool.query(
    `SELECT id, speaker_type, character_id, speaker_name, speaker_meta, text, sort_order
     FROM atlas_quotes
     WHERE node_type = $1
       AND node_id = $2
     ORDER BY sort_order ASC, id ASC`,
    [nodeType, nodeId]
  );
  const rows = result.rows as AtlasQuoteRow[];
  if (rows.length === 0) return [];

  const characterIds = [...new Set(rows.map((row) => row.character_id).filter((value): value is string => Boolean(value)))];
  const characterMap = new Map<string, AtlasQuoteCharacterData>();
  if (characterIds.length > 0) {
    const characterResult = await pool.query(
      `SELECT id, slug, name_ru, avatar_asset_path
       FROM characters
       WHERE id = ANY($1)
         AND archived_at IS NULL`,
      [characterIds]
    );

    for (const row of characterResult.rows as AtlasQuoteCharacterRow[]) {
      characterMap.set(row.id, toAtlasQuoteCharacter(row, "/api/atlas:quote:character"));
    }
  }

  return rows.map((row) =>
    validateResponse(
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
    )
  );
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function buildAnchorMode(nodeType: WorldNodeType, countryId: string | null, locationId: string | null): WorldNodeAnchorMode {
  if (nodeType === "country") return "country";
  if (nodeType === "location") return "location";
  if (locationId) return "location";
  if (countryId) return "country";
  return "free";
}

function sortWorldNodes(
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

async function resolveRelationTarget(
  type: EntityType,
  id: string,
  cache: Map<string, AtlasResolvedRelationTargetData | null>
) {
  const cacheKey = `${type}:${id}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  let target: AtlasResolvedRelationTargetData | null = null;

  switch (type) {
    case "character": {
      const result = await pool.query(
        "SELECT id, slug, name_ru, avatar_asset_path, country_id FROM characters WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as
        | { id: string; slug: string; name_ru: string; avatar_asset_path: string | null; country_id: string | null }
        | undefined;
      if (!row) break;

      const countryResult = row.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [row.country_id]
          )
        : { rows: [] };
      const countryRow = (countryResult.rows[0] as CountryRow | undefined) ?? null;

      target = validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("character", row.slug),
          title: row.name_ru,
          avatar_asset_path: row.avatar_asset_path ?? null,
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas:relation-target:character:country") : null
        },
        "/api/atlas:relation-target:character"
      );
      break;
    }
    case "atlas_entry": {
      const result = await pool.query(
        "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM atlas_entries WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as
        | { id: string; slug: string; title_ru: string; avatar_asset_path: string | null; country_id: string | null }
        | undefined;
      if (!row) break;

      const countryResult = row.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [row.country_id]
          )
        : { rows: [] };
      const countryRow = (countryResult.rows[0] as CountryRow | undefined) ?? null;

      target = validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("atlas_entry", row.slug),
          title: row.title_ru,
          avatar_asset_path: row.avatar_asset_path ?? null,
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas:relation-target:atlas-entry:country") : null
        },
        "/api/atlas:relation-target:atlas-entry"
      );
      break;
    }
    case "country": {
      const result = await pool.query(
        "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as CountryRow | undefined;
      if (!row) break;

      const country = toCountryFlag(row, "/api/atlas:relation-target:country:country");
      target = validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("country", row.slug),
          title: row.title_ru,
          avatar_asset_path: null,
          country
        },
        "/api/atlas:relation-target:country"
      );
      break;
    }
    case "location": {
      const result = await pool.query(
        "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM locations WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as
        | { id: string; slug: string; title_ru: string; avatar_asset_path: string | null; country_id: string | null }
        | undefined;
      if (!row) break;

      const countryResult = row.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [row.country_id]
          )
        : { rows: [] };
      const countryRow = (countryResult.rows[0] as CountryRow | undefined) ?? null;

      target = validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("location", row.slug),
          title: row.title_ru,
          avatar_asset_path: row.avatar_asset_path ?? null,
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas:relation-target:location:country") : null
        },
        "/api/atlas:relation-target:location"
      );
      break;
    }
    case "episode": {
      const result = await pool.query(
        "SELECT id, slug, title_ru, country_id FROM episodes WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as
        | { id: string; slug: string; title_ru: string; country_id: string | null }
        | undefined;
      if (!row) break;

      const countryResult = row.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [row.country_id]
          )
        : { rows: [] };
      const countryRow = (countryResult.rows[0] as CountryRow | undefined) ?? null;

      target = validateResponse(
        AtlasResolvedRelationTargetDTO,
        {
          type,
          id: row.id,
          slug: row.slug,
          url: entityUrl("episode", row.slug),
          title: row.title_ru,
          avatar_asset_path: null,
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas:relation-target:episode:country") : null
        },
        "/api/atlas:relation-target:episode"
      );
      break;
    }
    case "episode_series": {
      const result = await pool.query(
        "SELECT id, slug, title_ru FROM episode_series WHERE id = $1 AND archived_at IS NULL",
        [id]
      );
      const row = result.rows[0] as { id: string; slug: string; title_ru: string } | undefined;
      if (!row) break;

      target = validateResponse(
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
        "/api/atlas:relation-target:episode-series"
      );
      break;
    }
  }

  cache.set(cacheKey, target);
  return target;
}

async function resolveRelations(rows: AtlasLinkRow[]) {
  const targetCache = new Map<string, AtlasResolvedRelationTargetData | null>();

  return Promise.all(
    rows.map(async (row) =>
      validateResponse(
        AtlasResolvedRelationDTO,
        {
          from_type: row.from_type,
          from_id: row.from_id,
          to_type: row.to_type,
          to_id: row.to_id,
          label: row.label ?? null,
          target: await resolveRelationTarget(row.to_type, row.to_id, targetCache)
        },
        "/api/atlas:resolved-relation"
      )
    )
  );
}

export async function registerAtlasRoutes(app: FastifyInstance) {
  app.get("/api/atlas/catalog", async (req, reply) => {
    const query = parseQuery(reply, AtlasCatalogQueryDTO, req.query);
    if (!query) {
      return errorPayload("Invalid query parameters");
    }

    const { page, limit } = query;
    const sort = query.sort ?? "title_asc";

    const [countriesResult, locationsResult, atlasResult, linksResult] = await Promise.all([
      pool.query("SELECT id, slug, title_ru, flag_colors FROM countries WHERE archived_at IS NULL ORDER BY title_ru ASC"),
      pool.query(
        "SELECT id, slug, title_ru, summary, description_markdown, avatar_asset_path, country_id FROM locations WHERE archived_at IS NULL ORDER BY title_ru ASC"
      ),
      pool.query(
        "SELECT id, slug, kind, title_ru, summary, content_markdown, avatar_asset_path, country_id, location_id, published_at FROM atlas_entries WHERE archived_at IS NULL ORDER BY title_ru ASC"
      ),
      pool.query(
        "SELECT from_type, from_id, to_type, to_id, label FROM atlas_links WHERE from_type = 'atlas_entry'"
      )
    ]);

    const countries = countriesResult.rows as CountryRow[];
    const locations = locationsResult.rows as LocationRow[];
    const atlasEntries = atlasResult.rows as AtlasEntryRow[];
    const atlasLinks = linksResult.rows as AtlasLinkRow[];

    const countryById = new Map(countries.map((row) => [row.id, row]));
    const locationById = new Map(locations.map((row) => [row.id, row]));
    const incomingSourceIdsByTarget = new Map<string, Set<string>>();
    const incomingLabelsByTarget = new Map<string, string[]>();
    const outgoingCountByAtlasId = new Map<string, number>();

    for (const link of atlasLinks) {
      const targetKey = `${link.to_type}:${link.to_id}`;
      const sourceIds = incomingSourceIdsByTarget.get(targetKey) ?? new Set<string>();
      sourceIds.add(link.from_id);
      incomingSourceIdsByTarget.set(targetKey, sourceIds);

      const labels = incomingLabelsByTarget.get(targetKey) ?? [];
      if (link.label) labels.push(link.label);
      incomingLabelsByTarget.set(targetKey, labels);

      outgoingCountByAtlasId.set(link.from_id, (outgoingCountByAtlasId.get(link.from_id) ?? 0) + 1);
    }

    const locationRefsById = new Map<string, LocationReferenceData>();
    for (const row of locations) {
      const countryRow = row.country_id ? countryById.get(row.country_id) ?? null : null;
      locationRefsById.set(row.id, toLocationReference(row, countryRow, "/api/atlas/catalog:location-ref"));
    }

    const atlasNodes = atlasEntries.map((row) => {
      const location = row.location_id ? locationRefsById.get(row.location_id) ?? null : null;
      const explicitCountry = row.country_id ? countryById.get(row.country_id) ?? null : null;
      const locationCountry = location?.country ?? null;
      const resolvedCountry =
        explicitCountry ? toCountryFlag(explicitCountry, "/api/atlas/catalog:atlas-country") : locationCountry;
      const relatedCount = outgoingCountByAtlasId.get(row.id) ?? 0;
      const relationLabels = atlasLinks
        .filter((link) => link.from_id === row.id)
        .map((link) => link.label ?? "")
        .filter(Boolean);

      return {
        item: validateResponse(
          WorldNodeListItemDTO,
          {
            node_type: "atlas_entry",
            id: row.id,
            slug: row.slug,
            url: entityUrl("atlas_entry", row.slug),
            title_ru: row.title_ru,
            summary: row.summary ?? null,
            kind: row.kind,
            avatar_asset_path: row.avatar_asset_path ?? null,
            country: resolvedCountry,
            location,
            anchor_mode: buildAnchorMode("atlas_entry", explicitCountry?.id ?? locationCountry?.id ?? null, row.location_id),
            related_count: relatedCount,
            published_at: toNullableIsoDateTime(row.published_at)
          },
          "/api/atlas/catalog:atlas-item"
        ),
        searchText: [
          row.title_ru,
          row.summary ?? "",
          row.content_markdown ?? "",
          resolvedCountry?.title_ru ?? "",
          location?.title_ru ?? "",
          relationLabels.join(" ")
        ]
          .join(" ")
          .toLowerCase()
      };
    });

    const locationNodes = locations.map((row) => {
      const country = row.country_id ? countryById.get(row.country_id) ?? null : null;
      const locationRef = locationRefsById.get(row.id) ?? null;
      const anchoredAtlasTitles = atlasEntries.filter((entry) => entry.location_id === row.id).map((entry) => entry.title_ru);
      const incomingLabels = incomingLabelsByTarget.get(`location:${row.id}`) ?? [];
      const relatedIds = new Set<string>();

      for (const entry of atlasEntries) {
        if (entry.location_id === row.id) relatedIds.add(`atlas_entry:${entry.id}`);
      }
      for (const sourceId of incomingSourceIdsByTarget.get(`location:${row.id}`) ?? []) {
        relatedIds.add(`atlas_entry:${sourceId}`);
      }

      return {
        item: validateResponse(
          WorldNodeListItemDTO,
          {
            node_type: "location",
            id: row.id,
            slug: row.slug,
            url: entityUrl("location", row.slug),
            title_ru: row.title_ru,
            summary: row.summary ?? null,
            kind: null,
            avatar_asset_path: row.avatar_asset_path ?? null,
            country: country ? toCountryFlag(country, "/api/atlas/catalog:location-country") : null,
            location: locationRef,
            anchor_mode: "location",
            related_count: relatedIds.size,
            published_at: null
          },
          "/api/atlas/catalog:location-item"
        ),
        searchText: [
          row.title_ru,
          row.summary ?? "",
          row.description_markdown ?? "",
          country?.title_ru ?? "",
          anchoredAtlasTitles.join(" "),
          incomingLabels.join(" ")
        ]
          .join(" ")
          .toLowerCase()
      };
    });

    const countryNodes = countries.map((row) => {
      const locationTitles = locations.filter((location) => location.country_id === row.id).map((location) => location.title_ru);
      const atlasTitles = atlasEntries
        .filter((entry) => {
          const location = entry.location_id ? locationById.get(entry.location_id) ?? null : null;
          return entry.country_id === row.id || location?.country_id === row.id;
        })
        .map((entry) => entry.title_ru);
      const incomingLabels = incomingLabelsByTarget.get(`country:${row.id}`) ?? [];
      const relatedIds = new Set<string>();

      for (const location of locations) {
        if (location.country_id === row.id) relatedIds.add(`location:${location.id}`);
      }
      for (const entry of atlasEntries) {
        const location = entry.location_id ? locationById.get(entry.location_id) ?? null : null;
        if (entry.country_id === row.id || location?.country_id === row.id) {
          relatedIds.add(`atlas_entry:${entry.id}`);
        }
      }
      for (const sourceId of incomingSourceIdsByTarget.get(`country:${row.id}`) ?? []) {
        relatedIds.add(`atlas_entry:${sourceId}`);
      }

      return {
        item: validateResponse(
          WorldNodeListItemDTO,
          {
            node_type: "country",
            id: row.id,
            slug: row.slug,
            url: entityUrl("country", row.slug),
            title_ru: row.title_ru,
            summary: null,
            kind: null,
            avatar_asset_path: null,
            country: toCountryFlag(row, "/api/atlas/catalog:country-country"),
            location: null,
            anchor_mode: "country",
            related_count: relatedIds.size,
            published_at: null
          },
          "/api/atlas/catalog:country-item"
        ),
        searchText: [row.title_ru, locationTitles.join(" "), atlasTitles.join(" "), incomingLabels.join(" ")]
          .join(" ")
          .toLowerCase()
      };
    });

    const allItems = [...countryNodes, ...locationNodes, ...atlasNodes].filter(({ item, searchText }) => {
      if (query.entity && item.node_type !== query.entity) return false;
      if (query.kind && item.kind !== query.kind) return false;
      if (query.anchor && item.anchor_mode !== query.anchor) return false;
      if (query.country) {
        const countrySlug = item.country?.slug ?? (item.node_type === "country" ? item.slug : null);
        if (countrySlug !== query.country) return false;
      }
      if (query.q && !searchText.includes(normalizeText(query.q))) return false;
      return true;
    });

    const filteredItems = allItems.map(({ item }) => item);
    const sortedItems = sortWorldNodes(filteredItems, sort);
    const offset = (page - 1) * limit;
    const pagedItems = sortedItems.slice(offset, offset + limit);

    const countryFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();
    for (const item of filteredItems) {
      const country = item.country;
      if (!country) continue;
      const current = countryFacetMap.get(country.slug);
      if (current) {
        current.count += 1;
        continue;
      }
      countryFacetMap.set(country.slug, {
        id: country.id,
        slug: country.slug,
        title_ru: country.title_ru,
        count: 1
      });
    }

    return validateResponse(
      AtlasCatalogResponseDTO,
      {
        items: pagedItems,
        facets: {
          entity: [
            { value: "country", label: entityLabels.country, count: filteredItems.filter((item) => item.node_type === "country").length },
            { value: "location", label: entityLabels.location, count: filteredItems.filter((item) => item.node_type === "location").length },
            {
              value: "atlas_entry",
              label: entityLabels.atlas_entry,
              count: filteredItems.filter((item) => item.node_type === "atlas_entry").length
            }
          ],
          kind: Object.entries(atlasKindLabels).map(([value, label]) => ({
            value,
            label,
            count: filteredItems.filter((item) => item.node_type === "atlas_entry" && item.kind === value).length
          })),
          country: [...countryFacetMap.values()].sort((a, b) => a.title_ru.localeCompare(b.title_ru, "ru")),
          anchor: [
            { value: "country", label: anchorLabels.country, count: filteredItems.filter((item) => item.anchor_mode === "country").length },
            {
              value: "location",
              label: anchorLabels.location,
              count: filteredItems.filter((item) => item.anchor_mode === "location").length
            },
            { value: "free", label: anchorLabels.free, count: filteredItems.filter((item) => item.anchor_mode === "free").length }
          ]
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
    const entryResult = await pool.query(
      "SELECT id, slug, kind, title_ru, summary, avatar_asset_path, country_id FROM atlas_entries WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const entryRow = entryResult.rows[0] as AtlasEntryRow | undefined;

    if (!entryRow) {
      const countryResult = await pool.query(
        "SELECT id, slug, title_ru, flag_colors FROM countries WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const country = countryResult.rows[0] as CountryRow | undefined;
      if (country) {
        const countryItem = toCountryFlag(country, "/api/atlas/:slug/preview:fallback-country:country");

        return validateResponse(
          AtlasPreviewDTO,
          {
            node_type: "country",
            slug: country.slug,
            url: entityUrl("country", country.slug),
            kind: "geography",
            title_ru: country.title_ru,
            summary: null,
            avatar_asset_path: null,
            country: countryItem
          },
          "/api/atlas/:slug/preview:fallback-country"
        );
      }

      const locationResult = await pool.query(
        "SELECT id, slug, title_ru, summary, avatar_asset_path, country_id FROM locations WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const location = locationResult.rows[0] as LocationRow | undefined;
      if (!location) {
        reply.code(404);
        return errorPayload("Atlas entry not found");
      }

      const locationCountry = location.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [location.country_id]
          )
        : { rows: [] };
      const countryRow = (locationCountry.rows[0] as CountryRow | undefined) ?? null;

      return validateResponse(
        AtlasPreviewDTO,
        {
          node_type: "location",
          slug: location.slug,
          url: entityUrl("location", location.slug),
          kind: "geography",
          title_ru: location.title_ru,
          summary: location.summary ?? null,
          avatar_asset_path: location.avatar_asset_path ?? null,
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas/:slug/preview:fallback-location:country") : null
        },
        "/api/atlas/:slug/preview:fallback-location"
      );
    }

    const country = entryRow.country_id
      ? await pool.query(
          "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
          [entryRow.country_id]
        )
      : { rows: [] };
    const countryRow = (country.rows[0] as CountryRow | undefined) ?? null;

    return validateResponse(
      AtlasPreviewDTO,
      {
        node_type: "atlas_entry",
        slug: entryRow.slug,
        url: entityUrl("atlas_entry", entryRow.slug),
        kind: entryRow.kind,
        title_ru: entryRow.title_ru,
        summary: entryRow.summary ?? null,
        avatar_asset_path: entryRow.avatar_asset_path ?? null,
        country: countryRow ? toCountryFlag(countryRow, "/api/atlas/:slug/preview:country") : null
      },
      "/api/atlas/:slug/preview"
    );
  });

  app.get("/api/atlas/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const entryResult = await pool.query(
      "SELECT id, slug, kind, title_ru, summary, content_markdown, avatar_asset_path, country_id, location_id, published_at FROM atlas_entries WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const entryRow = entryResult.rows[0] as AtlasEntryRow | undefined;

    if (!entryRow) {
      const countryResult = await pool.query(
        "SELECT id, slug, title_ru, flag_colors FROM countries WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const country = countryResult.rows[0] as CountryRow | undefined;
      if (country) {
        const countryItem = toCountryFlag(country, "/api/atlas/:slug:fallback-country:country");
        const [fact, locationRows, atlasRows] = await Promise.all([
          loadAtlasFact("country", country.id),
          pool.query(
            "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM locations WHERE country_id = $1 AND archived_at IS NULL ORDER BY title_ru ASC",
            [country.id]
          ),
          pool.query(
            "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM atlas_entries WHERE country_id = $1 AND archived_at IS NULL ORDER BY title_ru ASC",
            [country.id]
          )
        ]);

        const relations = [
          ...(locationRows.rows as Array<{
            id: string;
            slug: string;
            title_ru: string;
            avatar_asset_path: string | null;
            country_id: string | null;
          }>).map((row) =>
            validateResponse(
              AtlasResolvedRelationDTO,
              {
                from_type: "country",
                from_id: country.id,
                to_type: "location",
                to_id: row.id,
                label: row.title_ru,
                target: {
                  type: "location",
                  id: row.id,
                  slug: row.slug,
                  url: entityUrl("location", row.slug),
                  title: row.title_ru,
                  avatar_asset_path: row.avatar_asset_path ?? null,
                  country: countryItem
                }
              },
              "/api/atlas/:slug:fallback-country:location-relation"
            )
          ),
          ...(atlasRows.rows as Array<{
            id: string;
            slug: string;
            title_ru: string;
            avatar_asset_path: string | null;
            country_id: string | null;
          }>).map((row) =>
            validateResponse(
              AtlasResolvedRelationDTO,
              {
                from_type: "country",
                from_id: country.id,
                to_type: "atlas_entry",
                to_id: row.id,
                label: row.title_ru,
                target: {
                  type: "atlas_entry",
                  id: row.id,
                  slug: row.slug,
                  url: entityUrl("atlas_entry", row.slug),
                  title: row.title_ru,
                  avatar_asset_path: row.avatar_asset_path ?? null,
                  country: countryItem
                }
              },
              "/api/atlas/:slug:fallback-country:atlas-relation"
            )
          )
        ];

        return validateResponse(
          AtlasDetailResponseDTO,
          {
            node_type: "country",
            entry: {
              id: country.id,
              slug: country.slug,
              url: entityUrl("country", country.slug),
              kind: "geography",
              title_ru: country.title_ru,
              summary: null,
              content_markdown: null,
              avatar_asset_path: null,
              country_id: country.id,
              location_id: null,
              published_at: null
            },
            country: countryItem,
            location: null,
            fact,
            quotes: [],
            relations
          },
          "/api/atlas/:slug:fallback-country"
        );
      }

      const locationResult = await pool.query(
        "SELECT id, slug, title_ru, summary, description_markdown, avatar_asset_path, country_id FROM locations WHERE slug = $1 AND archived_at IS NULL",
        [slug]
      );
      const location = locationResult.rows[0] as LocationRow | undefined;
      if (!location) {
        reply.code(404);
        return errorPayload("Atlas entry not found");
      }

      const locationCountry = location.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [location.country_id]
          )
        : { rows: [] };
      const countryRow = (locationCountry.rows[0] as CountryRow | undefined) ?? null;
      const locationRef = toLocationReference(location, countryRow, "/api/atlas/:slug:fallback-location:location");
      const [fact, quotes, atlasRows] = await Promise.all([
        loadAtlasFact("location", location.id),
        loadAtlasQuotes("location", location.id),
        pool.query(
          "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM atlas_entries WHERE location_id = $1 AND archived_at IS NULL ORDER BY title_ru ASC",
          [location.id]
        )
      ]);

      const relations = [
        ...(countryRow
          ? [
              validateResponse(
                AtlasResolvedRelationDTO,
                {
                  from_type: "location",
                  from_id: location.id,
                  to_type: "country",
                  to_id: countryRow.id,
                  label: countryRow.title_ru,
                  target: {
                    type: "country",
                    id: countryRow.id,
                    slug: countryRow.slug,
                    url: entityUrl("country", countryRow.slug),
                    title: countryRow.title_ru,
                    avatar_asset_path: null,
                    country: toCountryFlag(countryRow, "/api/atlas/:slug:fallback-location:country-target")
                  }
                },
                "/api/atlas/:slug:fallback-location:country-relation"
              )
            ]
          : []),
        ...(atlasRows.rows as Array<{
          id: string;
          slug: string;
          title_ru: string;
          avatar_asset_path: string | null;
          country_id: string | null;
        }>).map((row) =>
          validateResponse(
            AtlasResolvedRelationDTO,
            {
              from_type: "location",
              from_id: location.id,
              to_type: "atlas_entry",
              to_id: row.id,
              label: row.title_ru,
              target: {
                type: "atlas_entry",
                id: row.id,
                slug: row.slug,
                url: entityUrl("atlas_entry", row.slug),
                title: row.title_ru,
                avatar_asset_path: row.avatar_asset_path ?? null,
                country: countryRow ? toCountryFlag(countryRow, "/api/atlas/:slug:fallback-location:atlas-country") : null
              }
            },
            "/api/atlas/:slug:fallback-location:atlas-relation"
          )
        )
      ];

      return validateResponse(
        AtlasDetailResponseDTO,
        {
          node_type: "location",
          entry: {
            id: location.id,
            slug: location.slug,
            url: entityUrl("location", location.slug),
            kind: "geography",
            title_ru: location.title_ru,
            summary: location.summary ?? null,
            content_markdown: location.description_markdown ?? null,
            avatar_asset_path: location.avatar_asset_path ?? null,
            country_id: location.country_id ?? null,
            location_id: location.id,
            published_at: null
          },
          country: countryRow ? toCountryFlag(countryRow, "/api/atlas/:slug:fallback-location:country") : null,
          location: locationRef,
          fact,
          quotes,
          relations
        },
        "/api/atlas/:slug:fallback-location"
      );
    }

    const locationResult = entryRow.location_id
      ? await pool.query(
          "SELECT id, slug, title_ru, avatar_asset_path, country_id FROM locations WHERE id = $1 AND archived_at IS NULL",
          [entryRow.location_id]
        )
      : { rows: [] };
    const locationRow = (locationResult.rows[0] as LocationRow | undefined) ?? null;

    const explicitCountryResult = entryRow.country_id
      ? await pool.query(
          "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
          [entryRow.country_id]
        )
      : { rows: [] };
    const locationCountryResult =
      !entryRow.country_id && locationRow?.country_id
        ? await pool.query(
            "SELECT id, slug, title_ru, flag_colors FROM countries WHERE id = $1 AND archived_at IS NULL",
            [locationRow.country_id]
          )
        : { rows: [] };
    const countryRow =
      (explicitCountryResult.rows[0] as CountryRow | undefined) ??
      (locationCountryResult.rows[0] as CountryRow | undefined) ??
      null;

    const [linksResult, fact, quotes] = await Promise.all([
      pool.query(
        "SELECT from_type, from_id, to_type, to_id, label FROM atlas_links WHERE from_type = 'atlas_entry' AND from_id = $1",
        [entryRow.id]
      ),
      loadAtlasFact("atlas_entry", entryRow.id),
      supportsAtlasQuotes("atlas_entry", entryRow.kind) ? loadAtlasQuotes("atlas_entry", entryRow.id) : Promise.resolve([])
    ]);
    const linkRows = linksResult.rows as AtlasLinkRow[];

    const entry = validateResponse(
      AtlasEntryDTO,
      {
        id: entryRow.id,
        slug: entryRow.slug,
        url: entityUrl("atlas_entry", entryRow.slug),
        kind: entryRow.kind,
        title_ru: entryRow.title_ru,
        summary: entryRow.summary ?? null,
        content_markdown: entryRow.content_markdown ?? null,
        avatar_asset_path: entryRow.avatar_asset_path ?? null,
        country_id: entryRow.country_id ?? null,
        location_id: entryRow.location_id ?? null,
        published_at: toNullableIsoDateTime(entryRow.published_at)
      },
      "/api/atlas/:slug:entry"
    );

    return validateResponse(
      AtlasDetailResponseDTO,
      {
        node_type: "atlas_entry",
        entry,
        country: countryRow ? toCountryFlag(countryRow, "/api/atlas/:slug:country") : null,
        location: locationRow ? toLocationReference(locationRow, countryRow, "/api/atlas/:slug:location") : null,
        fact,
        quotes,
        relations: await resolveRelations(linkRows)
      },
      "/api/atlas/:slug"
    );
  });
}
