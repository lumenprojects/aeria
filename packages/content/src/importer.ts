import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { z } from "zod";
import { v5 as uuidv5 } from "uuid";
import { pool } from "./db.js";
import type { PoolClient } from "pg";
import { hashContent } from "./hash.js";
import {
  applyHashDiff,
  computeArchivedSourcePaths,
  emptySummary,
  type ImportSummary
} from "./import-summary.js";
import { normalizeMarkdown } from "./markdown.js";
import { readingMinutes } from "./reading.js";
import { collectLocalMissingReferences } from "./reference-validation.js";
import {
  atlasSchema,
  characterSchema,
  countrySchema,
  episodeSchema,
  locationSchema,
  seriesSchema,
  type AtlasFrontmatter,
  type CharacterFrontmatter,
  type CountryFrontmatter,
  type EpisodeFrontmatter,
  type LocationFrontmatter,
  type SeriesFrontmatter
} from "./schema.js";

const NAMESPACE = uuidv5("aeria", uuidv5.URL);

function entityId(type: string, slug: string) {
  return uuidv5(`${type}:${slug}`, NAMESPACE);
}

type ImportOptions = {
  rootDir: string;
  dryRun: boolean;
  batchSize: number;
  reindex: boolean;
};

type LoadedFile<T> = {
  id: string;
  slug: string;
  sourcePath: string;
  contentHash: string;
  frontmatter: T;
  body: string;
};

function isValidAssetPath(value: string) {
  return value.startsWith("/assets/") && !value.includes("..");
}

async function validateAvatarAssetPaths(
  locations: LoadedFile<LocationFrontmatter>[],
  characters: LoadedFile<CharacterFrontmatter>[],
  atlas: LoadedFile<AtlasFrontmatter>[],
  runId: number
) {
  const errors: string[] = [];

  for (const record of characters) {
    if (!isValidAssetPath(record.frontmatter.avatar_asset_path)) {
      errors.push(
        `[character] ${record.sourcePath}: avatar_asset_path must be an absolute web path in /assets/*`
      );
    }
  }

  for (const record of locations) {
    const value = record.frontmatter.avatar_asset_path;
    if (value && !isValidAssetPath(value)) {
      errors.push(
        `[location] ${record.sourcePath}: avatar_asset_path must be an absolute web path in /assets/*`
      );
    }
  }

  for (const record of atlas) {
    const value = record.frontmatter.avatar_asset_path;
    if (value && !isValidAssetPath(value)) {
      errors.push(
        `[atlas] ${record.sourcePath}: avatar_asset_path must be an absolute web path in /assets/*`
      );
    }
  }

  for (const error of errors) {
    await logImportError(runId, null, null, error);
  }

  if (errors.length) {
    throw new Error(`Avatar path validation failed: ${errors.length} issues`);
  }
}

async function loadSchemaVersion(rootDir: string) {
  const schemaPath = path.join(rootDir, "content", "schema.json");
  const raw = await fs.readFile(schemaPath, "utf8");
  const parsed = JSON.parse(raw) as { schema_version: number };
  return parsed.schema_version;
}

async function walkDir(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function loadFiles<T extends { slug: string }>(
  rootDir: string,
  dir: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  entity: string,
  useBody: boolean
): Promise<LoadedFile<T>[]> {
  const targetDir = path.join(rootDir, "content", dir);
  try {
    await fs.access(targetDir);
  } catch {
    return [];
  }

  const files = await walkDir(targetDir);
  const loaded: LoadedFile<T>[] = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const result = schema.safeParse(parsed.data);
    if (!result.success) {
      const error = result.error.flatten().fieldErrors;
      throw new Error(`[${entity}] ${filePath}: ${JSON.stringify(error)}`);
    }

    const normalizedBody = useBody ? await normalizeMarkdown(parsed.content) : "";
    const slug = result.data.slug;
    const sourcePath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    loaded.push({
      id: entityId(entity, slug),
      slug,
      sourcePath,
      contentHash: hashContent(raw),
      frontmatter: result.data,
      body: normalizedBody
    });
  }

  return loaded;
}

async function queryExistingSlugs(table: string, slugs: string[]) {
  if (slugs.length === 0) return new Set<string>();
  const result = await pool.query(
    `SELECT slug FROM ${table} WHERE slug = ANY($1) AND archived_at IS NULL`,
    [slugs]
  );
  return new Set(result.rows.map((row) => row.slug as string));
}

async function queryExistingBySlug(table: string, slugs: string[]) {
  if (slugs.length === 0) return new Map<string, { content_hash: string; source_path: string }>();
  const result = await pool.query(
    `SELECT slug, content_hash, source_path FROM ${table} WHERE slug = ANY($1)` ,
    [slugs]
  );
  return new Map(result.rows.map((row) => [row.slug, row]));
}

async function queryExistingSourcePaths(table: string) {
  const result = await pool.query(`SELECT source_path FROM ${table} WHERE archived_at IS NULL`);
  return new Set(result.rows.map((row) => row.source_path as string));
}

async function createImportRun(schemaVersion: number, status: string) {
  const result = await pool.query(
    "INSERT INTO import_runs (schema_version, status) VALUES ($1, $2) RETURNING id",
    [schemaVersion, status]
  );
  return result.rows[0].id as number;
}

async function updateImportRun(runId: number, status: string, summary: Record<string, ImportSummary>) {
  await pool.query(
    "UPDATE import_runs SET status = $1, ended_at = now(), summary = $2 WHERE id = $3",
    [status, summary, runId]
  );
}

async function logImportError(runId: number, entityType: string | null, sourcePath: string | null, error: string) {
  await pool.query(
    "INSERT INTO import_errors (run_id, entity_type, source_path, message) VALUES ($1, $2, $3, $4)",
    [runId, entityType, sourcePath, error]
  );
}

async function enqueueSearch(entityType: string, entityIdValue: string, action: "upsert" | "delete") {
  await pool.query(
    "INSERT INTO search_queue (entity_type, entity_id, action) VALUES ($1, $2, $3)",
    [entityType, entityIdValue, action]
  );
}

async function enqueueFullReindex() {
  const targets = [
    { table: "episodes", type: "episode" },
    { table: "characters", type: "character" },
    { table: "atlas_entries", type: "atlas_entry" },
    { table: "episode_series", type: "episode_series" },
    { table: "countries", type: "country" },
    { table: "locations", type: "location" }
  ];

  for (const target of targets) {
    const rows = await pool.query(`SELECT id FROM ${target.table} WHERE archived_at IS NULL`);
    for (const row of rows.rows) {
      await enqueueSearch(target.type, row.id, "upsert");
    }
  }
}

async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function archiveMissing(table: string, entityType: string, importedSources: Set<string>) {
  const existingSources = await queryExistingSourcePaths(table);
  const toArchive = computeArchivedSourcePaths(existingSources, importedSources);
  if (toArchive.length === 0) return 0;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE ${table} SET archived_at = now() WHERE source_path = ANY($1)`,
      [toArchive]
    );
  });

  if (entityType !== "atlas_links") {
    const ids = await pool.query(`SELECT id FROM ${table} WHERE source_path = ANY($1)`, [toArchive]);
    for (const row of ids.rows) {
      await enqueueSearch(entityType, row.id, "delete");
    }
  }

  return toArchive.length;
}

async function validateReferences(
  countries: LoadedFile<CountryFrontmatter>[],
  locations: LoadedFile<LocationFrontmatter>[],
  series: LoadedFile<SeriesFrontmatter>[],
  episodes: LoadedFile<EpisodeFrontmatter>[],
  characters: LoadedFile<CharacterFrontmatter>[],
  atlas: LoadedFile<AtlasFrontmatter>[],
  runId: number
) {
  const errors: string[] = [];
  const missing = collectLocalMissingReferences(
    countries,
    locations,
    series,
    episodes,
    characters,
    atlas
  );

  const missingCountryArray = [...missing.countries];
  const missingLocationArray = [...missing.locations];
  const missingSeriesArray = [...missing.series];
  const missingEpisodeArray = [...missing.episodes];
  const missingCharacterArray = [...missing.characters];
  const missingAtlasArray = [...missing.atlas];

  const existingCountries = await queryExistingSlugs("countries", missingCountryArray);
  const existingLocations = await queryExistingSlugs("locations", missingLocationArray);
  const existingSeries = await queryExistingSlugs("episode_series", missingSeriesArray);
  const existingEpisodes = await queryExistingSlugs("episodes", missingEpisodeArray);
  const existingCharacters = await queryExistingSlugs("characters", missingCharacterArray);
  const existingAtlas = await queryExistingSlugs("atlas_entries", missingAtlasArray);

  for (const slug of missingCountryArray) {
    if (!existingCountries.has(slug)) errors.push(`Missing country slug: ${slug}`);
  }
  for (const slug of missingLocationArray) {
    if (!existingLocations.has(slug)) errors.push(`Missing location slug: ${slug}`);
  }
  for (const slug of missingSeriesArray) {
    if (!existingSeries.has(slug)) errors.push(`Missing series slug: ${slug}`);
  }
  for (const slug of missingEpisodeArray) {
    if (!existingEpisodes.has(slug)) errors.push(`Missing episode slug: ${slug}`);
  }
  for (const slug of missingCharacterArray) {
    if (!existingCharacters.has(slug)) errors.push(`Missing character slug: ${slug}`);
  }
  for (const slug of missingAtlasArray) {
    if (!existingAtlas.has(slug)) errors.push(`Missing atlas slug: ${slug}`);
  }

  for (const error of errors) {
    await logImportError(runId, null, null, error);
  }

  if (errors.length) {
    throw new Error(`Reference validation failed: ${errors.length} issues`);
  }
}

async function upsertRows(
  client: PoolClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  conflictField = "slug"
) {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const insertSql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns
    .map((_, i) => `$${i + 1}`)
    .join(", ")}) ON CONFLICT (${conflictField}) DO UPDATE SET ${columns
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(", ")}`;

  for (const row of rows) {
    const values = columns.map((col) => row[col]);
    await client.query(insertSql, values);
  }
}

async function importCountries(records: LoadedFile<CountryFrontmatter>[], summary: ImportSummary, batchSize: number) {
  const existing = await queryExistingBySlug("countries", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    return {
      id: record.id,
      slug: record.slug,
      title_ru: frontmatter.title_ru,
      flag_emoji: frontmatter.flag_emoji ?? null,
      flag_asset_path: frontmatter.flag_asset_path ?? null,
      flag_colors: frontmatter.flag_colors ? JSON.stringify(frontmatter.flag_colors) : null,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "countries", batch);
    });
  }
  for (const record of records) {
    await enqueueSearch("country", record.id, "upsert");
  }

  summary.archived += await archiveMissing("countries", "country", new Set(records.map((r) => r.sourcePath)));
}

async function importLocations(records: LoadedFile<LocationFrontmatter>[], summary: ImportSummary, batchSize: number) {
  const existing = await queryExistingBySlug("locations", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    return {
      id: record.id,
      slug: record.slug,
      title_ru: frontmatter.title_ru,
      country_id: frontmatter.country_slug ? entityId("country", frontmatter.country_slug) : null,
      summary: frontmatter.summary ?? null,
      description_markdown: record.body || null,
      avatar_asset_path: frontmatter.avatar_asset_path ?? null,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "locations", batch);
    });
  }
  for (const record of records) {
    await enqueueSearch("location", record.id, "upsert");
  }

  summary.archived += await archiveMissing("locations", "location", new Set(records.map((r) => r.sourcePath)));
}

async function importSeries(records: LoadedFile<SeriesFrontmatter>[], summary: ImportSummary, batchSize: number) {
  const existing = await queryExistingBySlug("episode_series", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    return {
      id: record.id,
      slug: record.slug,
      title_ru: frontmatter.title_ru,
      brand_color: frontmatter.brand_color ?? null,
      summary: frontmatter.summary ?? null,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "episode_series", batch);
    });
  }
  for (const record of records) {
    await enqueueSearch("episode_series", record.id, "upsert");
  }

  summary.archived += await archiveMissing("episode_series", "episode_series", new Set(records.map((r) => r.sourcePath)));
}

async function importEpisodes(
  records: LoadedFile<EpisodeFrontmatter>[],
  summary: ImportSummary,
  batchSize: number
): Promise<{ episodeCharacters: Array<{ episodeId: string; characterId: string }>; episodeLocations: Array<{ episodeId: string; locationId: string }> }>
{
  const existing = await queryExistingBySlug("episodes", records.map((r) => r.slug));
  const episodeCharacters: Array<{ episodeId: string; characterId: string }> = [];
  const episodeLocations: Array<{ episodeId: string; locationId: string }> = [];

  const rows = records.map((record) => {
    const { frontmatter } = record;
    const computedReading = frontmatter.reading_minutes ?? readingMinutes(record.body);
    const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at) : null;

    for (const charSlug of frontmatter.characters ?? []) {
      episodeCharacters.push({
        episodeId: record.id,
        characterId: entityId("character", charSlug)
      });
    }

    for (const locSlug of frontmatter.locations ?? []) {
      episodeLocations.push({
        episodeId: record.id,
        locationId: entityId("location", locSlug)
      });
    }

    return {
      id: record.id,
      slug: record.slug,
      series_id: entityId("episode_series", frontmatter.series_slug),
      country_id: entityId("country", frontmatter.country_slug),
      episode_number: frontmatter.episode_number,
      global_order: frontmatter.global_order,
      title_native: frontmatter.title_native ?? null,
      title_ru: frontmatter.title_ru,
      summary: frontmatter.summary ?? null,
      content_markdown: record.body || null,
      reading_minutes: computedReading,
      published_at: publishedAt,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "episodes", batch);
    });
  }
  for (const record of records) {
    await enqueueSearch("episode", record.id, "upsert");
  }

  summary.archived += await archiveMissing("episodes", "episode", new Set(records.map((r) => r.sourcePath)));
  return { episodeCharacters, episodeLocations };
}

async function importCharacters(
  records: LoadedFile<CharacterFrontmatter>[],
  summary: ImportSummary,
  batchSize: number
): Promise<Array<{ characterId: string; affiliationId: string }>> {
  const existing = await queryExistingBySlug("characters", records.map((r) => r.slug));
  const affiliationSlugs = records
    .map((record) => record.frontmatter.affiliation_slug)
    .filter((slug): slug is string => Boolean(slug));
  const existingAffiliations = await queryExistingSlugs("atlas_entries", affiliationSlugs);
  const pendingAffiliations: Array<{ characterId: string; affiliationId: string }> = [];
  const rows = records.map((record) => {
    const { frontmatter } = record;
    const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at) : null;
    let affiliationId: string | null = null;
    if (frontmatter.affiliation_slug) {
      if (existingAffiliations.has(frontmatter.affiliation_slug)) {
        affiliationId = entityId("atlas_entry", frontmatter.affiliation_slug);
      } else {
        pendingAffiliations.push({
          characterId: record.id,
          affiliationId: entityId("atlas_entry", frontmatter.affiliation_slug)
        });
      }
    }
    return {
      id: record.id,
      slug: record.slug,
      name_ru: frontmatter.name_ru,
      avatar_asset_path: frontmatter.avatar_asset_path,
      name_native: frontmatter.name_native ?? null,
      affiliation_id: affiliationId,
      gender: frontmatter.gender ?? null,
      race: frontmatter.race ?? null,
      height_cm: frontmatter.height_cm ?? null,
      age: frontmatter.age ?? null,
      birth_country_id: frontmatter.birth_country_slug ? entityId("country", frontmatter.birth_country_slug) : null,
      favorite_food: frontmatter.favorite_food ?? null,
      orientation: frontmatter.orientation ?? null,
      description: frontmatter.description ?? null,
      quote: frontmatter.quote ?? null,
      bio_markdown: record.body || null,
      stats: frontmatter.stats ?? null,
      published_at: publishedAt,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const recordsBatch = records.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "characters", batch);
      for (const record of recordsBatch) {
        const traits = record.frontmatter.traits ?? [];
        const rumors = record.frontmatter.rumors ?? [];
        await client.query("DELETE FROM character_traits WHERE character_id = $1", [record.id]);
        await client.query("DELETE FROM character_rumors WHERE character_id = $1", [record.id]);

        let order = 0;
        for (const trait of traits) {
          await client.query(
            "INSERT INTO character_traits (character_id, text, sort_order) VALUES ($1, $2, $3)",
            [record.id, trait, order++]
          );
        }
        order = 0;
        for (const rumor of rumors) {
          await client.query(
            "INSERT INTO character_rumors (character_id, text, sort_order) VALUES ($1, $2, $3)",
            [record.id, rumor, order++]
          );
        }
      }
    });
  }

  for (const record of records) {
    await enqueueSearch("character", record.id, "upsert");
  }

  summary.archived += await archiveMissing("characters", "character", new Set(records.map((r) => r.sourcePath)));
  return pendingAffiliations;
}

async function applyPendingAffiliations(
  pending: Array<{ characterId: string; affiliationId: string }>,
  batchSize: number
) {
  if (pending.length === 0) return;
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      for (const item of batch) {
        await client.query(
          "UPDATE characters SET affiliation_id = $1, updated_at = now() WHERE id = $2",
          [item.affiliationId, item.characterId]
        );
      }
    });
  }
}

async function importAtlas(records: LoadedFile<AtlasFrontmatter>[], summary: ImportSummary, batchSize: number) {
  const existing = await queryExistingBySlug("atlas_entries", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at) : null;
    return {
      id: record.id,
      slug: record.slug,
      kind: frontmatter.kind,
      title_ru: frontmatter.title_ru,
      summary: frontmatter.summary ?? null,
      content_markdown: record.body || null,
      avatar_asset_path: frontmatter.avatar_asset_path ?? null,
      country_id: frontmatter.country_slug ? entityId("country", frontmatter.country_slug) : null,
      location_id: frontmatter.location_slug ? entityId("location", frontmatter.location_slug) : null,
      published_at: publishedAt,
      source_path: record.sourcePath,
      content_hash: record.contentHash,
      archived_at: null,
      updated_at: new Date()
    };
  });

  applyHashDiff(summary, records, existing);

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await withTransaction(async (client) => {
      await upsertRows(client, "atlas_entries", batch);
    });
  }
  for (const record of records) {
    await enqueueSearch("atlas_entry", record.id, "upsert");
  }

  summary.archived += await archiveMissing("atlas_entries", "atlas_entry", new Set(records.map((r) => r.sourcePath)));
}

async function importEpisodeLocations(rows: Array<{ episodeId: string; locationId: string }>) {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.episodeId) ?? [];
    list.push(row.locationId);
    grouped.set(row.episodeId, list);
  }

  for (const [episodeId, locationIds] of grouped) {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM episode_locations WHERE episode_id = $1", [episodeId]);
      for (const locationId of locationIds) {
        await client.query(
          "INSERT INTO episode_locations (episode_id, location_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [episodeId, locationId]
        );
      }
    });
  }
}

async function importEpisodeCharacters(rows: Array<{ episodeId: string; characterId: string }>) {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.episodeId) ?? [];
    list.push(row.characterId);
    grouped.set(row.episodeId, list);
  }

  for (const [episodeId, characterIds] of grouped) {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM episode_characters WHERE episode_id = $1", [episodeId]);
      for (const characterId of characterIds) {
        await client.query(
          "INSERT INTO episode_characters (episode_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [episodeId, characterId]
        );
      }
    });
  }
}

async function importAtlasLinks(records: LoadedFile<AtlasFrontmatter>[]) {
  for (const record of records) {
    const links = record.frontmatter.links ?? [];
    await withTransaction(async (client) => {
      await client.query(
        "DELETE FROM atlas_links WHERE from_type = 'atlas_entry' AND from_id = $1",
        [record.id]
      );

      for (const link of links) {
        const toId = entityId(link.type, link.slug);
        await client.query(
          "INSERT INTO atlas_links (from_type, from_id, to_type, to_id, label) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
          ["atlas_entry", record.id, link.type, toId, link.label ?? null]
        );
      }
    });
  }
}

async function diffSummary(table: string, records: LoadedFile<any>[], summary: ImportSummary) {
  const existing = await queryExistingBySlug(table, records.map((r) => r.slug));
  applyHashDiff(summary, records, existing);
  const existingSources = await queryExistingSourcePaths(table);
  const importedSources = new Set(records.map((r) => r.sourcePath));
  summary.archived += computeArchivedSourcePaths(existingSources, importedSources).length;
}

export async function runImport(options: ImportOptions) {
  const schemaVersion = await loadSchemaVersion(options.rootDir);
  const runId = await createImportRun(schemaVersion, options.dryRun ? "dry-run" : "running");
  const summary: Record<string, ImportSummary> = {
    countries: emptySummary(),
    locations: emptySummary(),
    series: emptySummary(),
    episodes: emptySummary(),
    characters: emptySummary(),
    atlas: emptySummary()
  };

  try {
    const [countries, locations, series, episodes, characters, atlas] = await Promise.all([
      loadFiles(options.rootDir, "countries", countrySchema, "country", false),
      loadFiles(options.rootDir, "locations", locationSchema, "location", true),
      loadFiles(options.rootDir, "series", seriesSchema, "episode_series", false),
      loadFiles(options.rootDir, "episodes", episodeSchema, "episode", true),
      loadFiles(options.rootDir, "characters", characterSchema, "character", true),
      loadFiles(options.rootDir, "atlas", atlasSchema, "atlas_entry", true)
    ]);

    await validateAvatarAssetPaths(locations, characters, atlas, runId);
    await validateReferences(countries, locations, series, episodes, characters, atlas, runId);

    if (options.dryRun) {
      await diffSummary("countries", countries, summary.countries);
      await diffSummary("locations", locations, summary.locations);
      await diffSummary("episode_series", series, summary.series);
      await diffSummary("episodes", episodes, summary.episodes);
      await diffSummary("characters", characters, summary.characters);
      await diffSummary("atlas_entries", atlas, summary.atlas);

      await updateImportRun(runId, "dry-run", summary);
      return { runId, summary };
    }

    await importCountries(countries, summary.countries, options.batchSize);
    await importLocations(locations, summary.locations, options.batchSize);
    await importSeries(series, summary.series, options.batchSize);
    const { episodeCharacters, episodeLocations } = await importEpisodes(episodes, summary.episodes, options.batchSize);
    const pendingAffiliations = await importCharacters(characters, summary.characters, options.batchSize);
    await importAtlas(atlas, summary.atlas, options.batchSize);
    await applyPendingAffiliations(pendingAffiliations, options.batchSize);
    await importEpisodeLocations(episodeLocations);
    await importEpisodeCharacters(episodeCharacters);
    await importAtlasLinks(atlas);

    if (options.reindex) {
      await enqueueFullReindex();
    }
    await updateImportRun(runId, "completed", summary);
    return { runId, summary };
  } catch (error: any) {
    await logImportError(runId, null, null, error.message ?? String(error));
    await updateImportRun(runId, "failed", summary);
    throw error;
  }
}
