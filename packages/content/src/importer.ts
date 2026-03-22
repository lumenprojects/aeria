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
  characterSchema,
  episodeSchema,
  seriesSchema,
  worldSchema,
  type CharacterFrontmatter,
  type EpisodeFrontmatter,
  type SeriesFrontmatter,
  type WorldFrontmatter
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
  world: LoadedFile<WorldFrontmatter>[],
  characters: LoadedFile<CharacterFrontmatter>[],
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

  for (const record of world) {
    const value = record.frontmatter.avatar_asset_path;
    if (value && !isValidAssetPath(value)) {
      errors.push(
        `[world] ${record.sourcePath}: avatar_asset_path must be an absolute web path in /assets/*`
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
    `SELECT slug, content_hash, source_path FROM ${table} WHERE slug = ANY($1)`,
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
    { table: "atlas_entities", type: "atlas_entity" },
    { table: "episode_series", type: "episode_series" }
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

  const ids = await pool.query(`SELECT id FROM ${table} WHERE source_path = ANY($1)`, [toArchive]);
  for (const row of ids.rows) {
    await enqueueSearch(entityType, row.id, "delete");
  }

  return toArchive.length;
}

async function validateReferences(
  world: LoadedFile<WorldFrontmatter>[],
  series: LoadedFile<SeriesFrontmatter>[],
  episodes: LoadedFile<EpisodeFrontmatter>[],
  characters: LoadedFile<CharacterFrontmatter>[],
  runId: number
) {
  const errors: string[] = [];
  const missing = collectLocalMissingReferences(world, series, episodes, characters);

  const missingAtlasArray = [...missing.atlas_entities];
  const missingSeriesArray = [...missing.series];
  const missingEpisodeArray = [...missing.episodes];
  const missingCharacterArray = [...missing.characters];

  const existingAtlas = await queryExistingSlugs("atlas_entities", missingAtlasArray);
  const existingSeries = await queryExistingSlugs("episode_series", missingSeriesArray);
  const existingEpisodes = await queryExistingSlugs("episodes", missingEpisodeArray);
  const existingCharacters = await queryExistingSlugs("characters", missingCharacterArray);

  for (const slug of missingAtlasArray) {
    if (!existingAtlas.has(slug)) errors.push(`Missing world slug: ${slug}`);
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

  errors.push(...missing.typeViolations);

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

async function importWorld(records: LoadedFile<WorldFrontmatter>[], summary: ImportSummary, batchSize: number) {
  const existing = await queryExistingBySlug("atlas_entities", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    return {
      id: record.id,
      slug: record.slug,
      type: frontmatter.type,
      title_ru: frontmatter.title_ru,
      summary: frontmatter.summary ?? null,
      overview_markdown: record.body || null,
      avatar_asset_path: frontmatter.avatar_asset_path ?? null,
      flag_colors: frontmatter.type === "country" && frontmatter.flag_colors
        ? JSON.stringify(frontmatter.flag_colors)
        : null,
      country_entity_id:
        frontmatter.country_slug && frontmatter.country_slug !== record.slug
          ? entityId("atlas_entity", frontmatter.country_slug)
          : null,
      location_entity_id:
        frontmatter.location_slug && frontmatter.location_slug !== record.slug
          ? entityId("atlas_entity", frontmatter.location_slug)
          : null,
      published_at: frontmatter.published_at ? new Date(frontmatter.published_at) : null,
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
      await upsertRows(client, "atlas_entities", batch);

      for (const record of recordsBatch) {
        await client.query("DELETE FROM atlas_entity_facts WHERE atlas_entity_id = $1", [record.id]);
        await client.query("DELETE FROM atlas_entity_quotes WHERE atlas_entity_id = $1", [record.id]);
        await client.query("DELETE FROM atlas_entity_sections WHERE atlas_entity_id = $1", [record.id]);
        await client.query("DELETE FROM atlas_entity_links WHERE from_atlas_entity_id = $1", [record.id]);

        for (const [index, section] of (record.frontmatter.sections ?? []).entries()) {
          await client.query(
            `INSERT INTO atlas_entity_sections
               (atlas_entity_id, section, title_ru, summary, body_markdown, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              record.id,
              section.key,
              section.title_ru,
              section.summary ?? null,
              section.body_markdown ?? null,
              index
            ]
          );

          if (section.fact) {
            await client.query(
              `INSERT INTO atlas_entity_facts
                 (atlas_entity_id, section, title, text, meta)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                record.id,
                section.key,
                section.fact.title,
                section.fact.text,
                section.fact.meta ?? null
              ]
            );
          }

          for (const [quoteIndex, quote] of (section.quotes ?? []).entries()) {
            const isCharacterQuote = "character_slug" in quote;
            await client.query(
              `INSERT INTO atlas_entity_quotes
                 (atlas_entity_id, section, speaker_type, character_id, speaker_name, speaker_meta, text, sort_order)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                record.id,
                section.key,
                isCharacterQuote ? "character" : "world",
                isCharacterQuote ? entityId("character", quote.character_slug) : null,
                isCharacterQuote ? null : quote.speaker_name,
                isCharacterQuote ? null : (quote.speaker_meta ?? null),
                quote.text,
                quoteIndex
              ]
            );
          }
        }

        for (const [index, link] of (record.frontmatter.links ?? []).entries()) {
          await client.query(
            `INSERT INTO atlas_entity_links
               (from_atlas_entity_id, to_type, to_id, label, sort_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [
              record.id,
              link.type,
              entityId(link.type, link.slug),
              link.label ?? null,
              index
            ]
          );
        }
      }
    });
  }

  for (const record of records) {
    await enqueueSearch("atlas_entity", record.id, "upsert");
  }

  summary.archived += await archiveMissing(
    "atlas_entities",
    "atlas_entity",
    new Set(records.map((r) => r.sourcePath))
  );
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

  summary.archived += await archiveMissing(
    "episode_series",
    "episode_series",
    new Set(records.map((r) => r.sourcePath))
  );
}

async function importEpisodes(
  records: LoadedFile<EpisodeFrontmatter>[],
  summary: ImportSummary,
  batchSize: number
): Promise<{
  episodeCharacters: Array<{ episodeId: string; characterId: string; sortOrder: number }>;
  episodeAtlasEntities: Array<{ episodeId: string; atlasEntityId: string; sortOrder: number }>;
}> {
  const existing = await queryExistingBySlug("episodes", records.map((r) => r.slug));
  const episodeCharacters: Array<{ episodeId: string; characterId: string; sortOrder: number }> = [];
  const episodeAtlasEntities: Array<{ episodeId: string; atlasEntityId: string; sortOrder: number }> = [];

  const rows = records.map((record) => {
    const { frontmatter } = record;
    const computedReading = frontmatter.reading_minutes ?? readingMinutes(record.body);
    const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at) : null;

    for (const [index, charSlug] of (frontmatter.characters ?? []).entries()) {
      episodeCharacters.push({
        episodeId: record.id,
        characterId: entityId("character", charSlug),
        sortOrder: index
      });
    }

    for (const [index, slug] of (frontmatter.locations ?? []).entries()) {
      episodeAtlasEntities.push({
        episodeId: record.id,
        atlasEntityId: entityId("atlas_entity", slug),
        sortOrder: index
      });
    }

    return {
      id: record.id,
      slug: record.slug,
      series_id: entityId("episode_series", frontmatter.series_slug),
      country_entity_id: entityId("atlas_entity", frontmatter.country_slug),
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
  return { episodeCharacters, episodeAtlasEntities };
}

async function importCharacters(
  records: LoadedFile<CharacterFrontmatter>[],
  summary: ImportSummary,
  batchSize: number
) {
  const existing = await queryExistingBySlug("characters", records.map((r) => r.slug));
  const rows = records.map((record) => {
    const { frontmatter } = record;
    const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at) : null;

    return {
      id: record.id,
      slug: record.slug,
      name_ru: frontmatter.name_ru,
      avatar_asset_path: frontmatter.avatar_asset_path,
      name_native: frontmatter.name_native ?? null,
      affiliation_entity_id: frontmatter.affiliation_slug ? entityId("atlas_entity", frontmatter.affiliation_slug) : null,
      country_entity_id: entityId("atlas_entity", frontmatter.country_slug),
      tagline: frontmatter.tagline ?? null,
      gender: frontmatter.gender ?? null,
      race: frontmatter.race ?? null,
      height_cm: frontmatter.height_cm ?? null,
      age: frontmatter.age ?? null,
      favorite_food: frontmatter.favorite_food ?? null,
      orientation: frontmatter.orientation ?? null,
      mbti: frontmatter.mbti ?? null,
      listed: frontmatter.listed,
      home_featured: frontmatter.home_featured,
      home_intro_title: frontmatter.home_intro_title ?? null,
      home_intro_markdown: frontmatter.home_intro_markdown ?? null,
      bio_markdown: record.body || null,
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
        const quirks = record.frontmatter.quirks ?? [];
        const rumors = record.frontmatter.rumors ?? [];
        await client.query("DELETE FROM character_quirks WHERE character_id = $1", [record.id]);
        await client.query("DELETE FROM character_rumors WHERE character_id = $1", [record.id]);

        let order = 0;
        for (const quirk of quirks) {
          await client.query(
            "INSERT INTO character_quirks (character_id, text, sort_order) VALUES ($1, $2, $3)",
            [record.id, quirk, order++]
          );
        }

        order = 0;
        for (const rumor of rumors) {
          const sourceId =
            rumor.source_type && rumor.source_slug ? entityId(rumor.source_type, rumor.source_slug) : null;
          await client.query(
            `INSERT INTO character_rumors
               (character_id, text, author_name, author_meta, source_type, source_id, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              record.id,
              rumor.text,
              rumor.author_name,
              rumor.author_meta ?? null,
              rumor.source_type ?? null,
              sourceId,
              order++
            ]
          );
        }
      }
    });
  }

  for (const record of records) {
    await enqueueSearch("character", record.id, "upsert");
  }

  summary.archived += await archiveMissing("characters", "character", new Set(records.map((r) => r.sourcePath)));
}

async function importEpisodeAtlasEntities(
  rows: Array<{ episodeId: string; atlasEntityId: string; sortOrder: number }>
) {
  const grouped = new Map<string, Array<{ atlasEntityId: string; sortOrder: number }>>();
  for (const row of rows) {
    const list = grouped.get(row.episodeId) ?? [];
    list.push({ atlasEntityId: row.atlasEntityId, sortOrder: row.sortOrder });
    grouped.set(row.episodeId, list);
  }

  for (const [episodeId, entityRows] of grouped) {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM episode_atlas_entities WHERE episode_id = $1", [episodeId]);
      for (const { atlasEntityId, sortOrder } of entityRows) {
        await client.query(
          `INSERT INTO episode_atlas_entities (episode_id, atlas_entity_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [episodeId, atlasEntityId, sortOrder]
        );
      }
    });
  }
}

async function importEpisodeCharacters(rows: Array<{ episodeId: string; characterId: string; sortOrder: number }>) {
  const grouped = new Map<string, Array<{ characterId: string; sortOrder: number }>>();
  for (const row of rows) {
    const list = grouped.get(row.episodeId) ?? [];
    list.push({ characterId: row.characterId, sortOrder: row.sortOrder });
    grouped.set(row.episodeId, list);
  }

  for (const [episodeId, characterRows] of grouped) {
    await withTransaction(async (client) => {
      await client.query("DELETE FROM episode_characters WHERE episode_id = $1", [episodeId]);
      for (const { characterId, sortOrder } of characterRows) {
        await client.query(
          `INSERT INTO episode_characters (episode_id, character_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [episodeId, characterId, sortOrder]
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
    world: emptySummary(),
    series: emptySummary(),
    episodes: emptySummary(),
    characters: emptySummary()
  };

  try {
    const [world, series, episodes, characters] = await Promise.all([
      loadFiles(options.rootDir, "world", worldSchema, "atlas_entity", true),
      loadFiles(options.rootDir, "series", seriesSchema, "episode_series", false),
      loadFiles(options.rootDir, "episodes", episodeSchema, "episode", true),
      loadFiles(options.rootDir, "characters", characterSchema, "character", true)
    ]);

    await validateAvatarAssetPaths(world, characters, runId);
    await validateReferences(world, series, episodes, characters, runId);

    if (options.dryRun) {
      await diffSummary("atlas_entities", world, summary.world);
      await diffSummary("episode_series", series, summary.series);
      await diffSummary("episodes", episodes, summary.episodes);
      await diffSummary("characters", characters, summary.characters);

      await updateImportRun(runId, "dry-run", summary);
      return { runId, summary };
    }

    await importWorld(world, summary.world, options.batchSize);
    await importSeries(series, summary.series, options.batchSize);
    const { episodeCharacters, episodeAtlasEntities } = await importEpisodes(
      episodes,
      summary.episodes,
      options.batchSize
    );
    await importCharacters(characters, summary.characters, options.batchSize);
    await importEpisodeAtlasEntities(episodeAtlasEntities);
    await importEpisodeCharacters(episodeCharacters);

    if (options.reindex) {
      await enqueueFullReindex();
    }

    await updateImportRun(runId, "completed", summary);
    return { runId, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logImportError(runId, null, null, message);
    await updateImportRun(runId, "failed", summary);
    throw error;
  }
}
