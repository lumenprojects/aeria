import Typesense from "typesense";
import fs from "fs/promises";
import path from "path";
import { pool } from "./db.js";

const searchCollections = [
  "episodes",
  "characters",
  "atlas_entities",
  "episode_series"
] as const;

const searchTargets = [
  { table: "episodes", type: "episode", where: "archived_at IS NULL" },
  { table: "characters", type: "character", where: "archived_at IS NULL AND listed = TRUE" },
  { table: "atlas_entities", type: "atlas_entity", where: "archived_at IS NULL" },
  { table: "episode_series", type: "episode_series", where: "archived_at IS NULL" }
] as const;

type SearchCollectionName = (typeof searchCollections)[number];
type SearchEntityType = (typeof searchTargets)[number]["type"];

type SearchDocument = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  section?: string | null;
  series?: string | null;
  country?: string | null;
  location?: string | null;
  type: SearchEntityType;
  url: string;
};

const collectionMap: Record<SearchEntityType, SearchCollectionName> = {
  episode: "episodes",
  character: "characters",
  atlas_entity: "atlas_entities",
  episode_series: "episode_series"
};

function createTypesenseClient() {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_KEY;
  const port = Number(process.env.TYPESENSE_PORT || 8108);
  const protocol = process.env.TYPESENSE_PROTOCOL || "http";
  if (!host || !apiKey) return null;
  return new Typesense.Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 5
  });
}

export const typesenseClient = createTypesenseClient();

function getTypesenseClient() {
  if (!typesenseClient) {
    throw new Error("Typesense is not configured.");
  }

  return typesenseClient;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createCollection(client: Typesense.Client, name: SearchCollectionName) {
  await client.collections().create({
    name,
    fields: [
      { name: "id", type: "string" },
      { name: "slug", type: "string" },
      { name: "title", type: "string" },
      { name: "summary", type: "string", optional: true },
      { name: "body", type: "string", optional: true },
      { name: "section", type: "string", optional: true },
      { name: "series", type: "string", optional: true },
      { name: "country", type: "string", optional: true },
      { name: "location", type: "string", optional: true },
      { name: "type", type: "string" },
      { name: "url", type: "string" }
    ]
  });
}

export async function ensureCollections(client = getTypesenseClient()) {
  for (const name of searchCollections) {
    try {
      await client.collections(name).retrieve();
    } catch {
      await createCollection(client, name);
    }
  }
}

export async function recreateCollections(client = getTypesenseClient()) {
  for (const name of searchCollections) {
    try {
      await client.collections(name).delete();
    } catch {
      // collection may be absent already
    }

    await createCollection(client, name);
  }
}

export async function syncSynonyms(client = getTypesenseClient()) {
  try {
    const baseDir = process.env.INIT_CWD ?? process.cwd();
    const configPath = path.join(baseDir, "config", "search-synonyms.json");
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as { synonyms?: Array<{ id: string; synonyms: string[] }> };
    if (!parsed.synonyms) return;

    for (const collection of searchCollections) {
      for (const entry of parsed.synonyms) {
        await client.collections(collection).synonyms().upsert(entry.id, {
          synonyms: entry.synonyms
        });
      }
    }
  } catch {
    // no synonyms configured
  }
}

async function fetchEntity(entityType: SearchEntityType, entityId: string) {
  switch (entityType) {
    case "episode":
      return pool.query<Record<string, unknown>>(
        `SELECT e.*, s.slug AS series_slug, c.slug AS country_slug
         FROM episodes e
         JOIN episode_series s ON s.id = e.series_id
         JOIN atlas_entities c ON c.id = e.country_entity_id
         WHERE e.id = $1 AND e.archived_at IS NULL`,
        [entityId]
      );
    case "character":
      return pool.query<Record<string, unknown>>(
        `SELECT * FROM characters WHERE id = $1 AND archived_at IS NULL AND listed = TRUE`,
        [entityId]
      );
    case "atlas_entity":
      return pool.query<Record<string, unknown>>(
        `SELECT ae.*,
                country.slug AS country_slug,
                location.slug AS location_slug,
                (
                  SELECT STRING_AGG(section::text, ' ' ORDER BY sort_order ASC, id ASC)
                  FROM atlas_entity_sections
                  WHERE atlas_entity_id = ae.id
                ) AS sections_text,
                (
                  SELECT STRING_AGG(COALESCE(summary, '') || ' ' || COALESCE(body_markdown, ''), ' ' ORDER BY sort_order ASC, id ASC)
                  FROM atlas_entity_sections
                  WHERE atlas_entity_id = ae.id
                ) AS sections_body
         FROM atlas_entities ae
         LEFT JOIN atlas_entities country ON country.id = ae.country_entity_id
         LEFT JOIN atlas_entities location ON location.id = ae.location_entity_id
         WHERE ae.id = $1 AND ae.archived_at IS NULL`,
        [entityId]
      );
    case "episode_series":
      return pool.query<Record<string, unknown>>(
        `SELECT * FROM episode_series WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
  }
}

function buildDocument(entityType: SearchEntityType, row: Record<string, unknown>): SearchDocument | null {
  switch (entityType) {
    case "episode":
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title_ru),
        summary: row.summary ? String(row.summary) : null,
        body: row.content_markdown ? String(row.content_markdown) : null,
        series: row.series_slug ? String(row.series_slug) : null,
        country: row.country_slug ? String(row.country_slug) : null,
        type: "episode",
        url: `/episodes/${String(row.slug)}`
      };
    case "character":
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.name_ru),
        summary: row.tagline ? String(row.tagline) : null,
        body: row.bio_markdown ? String(row.bio_markdown) : null,
        type: "character",
        url: `/characters/${String(row.slug)}`
      };
    case "atlas_entity":
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title_ru),
        summary: row.summary ? String(row.summary) : null,
        body: [row.overview_markdown, row.sections_body].filter(Boolean).join(" ") || null,
        section: row.sections_text ? String(row.sections_text) : null,
        country: row.country_slug ? String(row.country_slug) : null,
        location: row.location_slug ? String(row.location_slug) : null,
        type: "atlas_entity",
        url: `/atlas/${String(row.slug)}`
      };
    case "episode_series":
      return {
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title_ru),
        summary: row.summary ? String(row.summary) : null,
        type: "episode_series",
        url: `/episodes?series=${String(row.slug)}`
      };
    default:
      return null;
  }
}

async function indexEntity(client: Typesense.Client, entityType: SearchEntityType, entityId: string) {
  const entityResult = await fetchEntity(entityType, entityId);
  const row = entityResult.rows[0];
  if (!row) {
    return false;
  }

  const document = buildDocument(entityType, row);
  if (!document) {
    return false;
  }

  await client.collections(collectionMap[entityType]).documents().upsert(document);
  return true;
}

export async function processQueueBatch(limit = 20, client = getTypesenseClient()) {
  const result = await pool.query<{
    id: number;
    entity_type: SearchEntityType;
    entity_id: string;
    action: "upsert" | "delete";
    attempts: number;
  }>(
    `SELECT id, entity_type, entity_id, action, attempts
     FROM search_queue
     WHERE status = 'pending' AND next_run_at <= now()
     ORDER BY id ASC
     LIMIT $1`,
    [limit]
  );

  let processed = 0;
  let failed = 0;

  for (const item of result.rows) {
    try {
      const collection = collectionMap[item.entity_type];

      if (item.action === "delete") {
        try {
          await client.collections(collection).documents(item.entity_id).delete();
        } catch {
          // document may already be absent
        }
      } else {
        const indexed = await indexEntity(client, item.entity_type, item.entity_id);
        if (!indexed) {
          try {
            await client.collections(collection).documents(item.entity_id).delete();
          } catch {
            // document may already be absent
          }
        }
      }

      await pool.query(
        "UPDATE search_queue SET status = 'done', updated_at = now() WHERE id = $1",
        [item.id]
      );
      processed += 1;
    } catch (error) {
      const attempts = item.attempts + 1;
      const nextRun = new Date(Date.now() + Math.min(60000, attempts * 5000));

      await pool.query(
        "UPDATE search_queue SET attempts = $1, next_run_at = $2, last_error = $3, updated_at = now() WHERE id = $4",
        [attempts, nextRun, error instanceof Error ? error.message : String(error), item.id]
      );
      failed += 1;
    }
  }

  return {
    processed,
    failed
  };
}

export async function runQueueWorker(options?: { watch?: boolean; pollMs?: number; batchSize?: number }) {
  const client = getTypesenseClient();
  const watch = options?.watch ?? false;
  const pollMs = options?.pollMs ?? 5000;
  const batchSize = options?.batchSize ?? 20;

  await ensureCollections(client);
  await syncSynonyms(client);

  while (true) {
    const batch = await processQueueBatch(batchSize, client);
    if (!watch && batch.processed === 0) {
      return batch;
    }

    if (watch && batch.processed === 0) {
      await sleep(pollMs);
    }
  }
}

export async function rebuildSearchIndex() {
  const client = getTypesenseClient();

  await recreateCollections(client);
  await syncSynonyms(client);

  const byType: Array<{ type: SearchEntityType; count: number }> = [];
  let total = 0;

  for (const target of searchTargets) {
    const idResult = await pool.query<{ id: string }>(
      `SELECT id::text AS id FROM ${target.table} WHERE ${target.where} ORDER BY id ASC`
    );

    let indexedCount = 0;
    for (const row of idResult.rows) {
      const indexed = await indexEntity(client, target.type, row.id);
      if (indexed) {
        indexedCount += 1;
      }
    }

    byType.push({ type: target.type, count: indexedCount });
    total += indexedCount;
  }

  return {
    total,
    byType
  };
}
