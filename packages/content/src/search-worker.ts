import "dotenv/config";
import Typesense from "typesense";
import fs from "fs/promises";
import path from "path";
import { pool } from "./db.js";

const typesenseClient = (() => {
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
})();

const collections = [
  "episodes",
  "characters",
  "atlas_entries",
  "episode_series",
  "countries",
  "locations"
] as const;

async function ensureCollections() {
  if (!typesenseClient) return;
  for (const name of collections) {
    try {
      await typesenseClient.collections(name).retrieve();
    } catch {
      await typesenseClient.collections().create({
        name,
        fields: [
          { name: "id", type: "string" },
          { name: "slug", type: "string" },
          { name: "title", type: "string" },
          { name: "summary", type: "string", optional: true },
          { name: "body", type: "string", optional: true },
          { name: "kind", type: "string", optional: true },
          { name: "series", type: "string", optional: true },
          { name: "country", type: "string", optional: true },
          { name: "location", type: "string", optional: true },
          { name: "type", type: "string" },
          { name: "url", type: "string" }
        ]
      });
    }
  }
}

async function syncSynonyms() {
  if (!typesenseClient) return;
  try {
    const baseDir = process.env.INIT_CWD ?? process.cwd();
    const configPath = path.join(baseDir, "config", "search-synonyms.json");
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as { synonyms?: Array<{ id: string; synonyms: string[] }> };
    if (!parsed.synonyms) return;
    for (const collection of collections) {
      for (const entry of parsed.synonyms) {
        await typesenseClient.collections(collection).synonyms().upsert(entry.id, {
          synonyms: entry.synonyms
        });
      }
    }
  } catch {
    // no synonyms configured
  }
}

async function fetchEntity(entityType: string, entityId: string) {
  switch (entityType) {
    case "episode":
      return pool.query(
        `SELECT e.*, s.slug as series_slug, c.slug as country_slug
         FROM episodes e
         JOIN episode_series s ON s.id = e.series_id
         JOIN countries c ON c.id = e.country_id
         WHERE e.id = $1 AND e.archived_at IS NULL`,
        [entityId]
      );
    case "character":
      return pool.query(
        `SELECT * FROM characters WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
    case "atlas_entry":
      return pool.query(
        `SELECT * FROM atlas_entries WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
    case "episode_series":
      return pool.query(
        `SELECT * FROM episode_series WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
    case "country":
      return pool.query(
        `SELECT * FROM countries WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
    case "location":
      return pool.query(
        `SELECT * FROM locations WHERE id = $1 AND archived_at IS NULL`,
        [entityId]
      );
    default:
      return { rows: [] } as any;
  }
}

async function buildDocument(entityType: string, row: any) {
  switch (entityType) {
    case "episode":
      return {
        id: row.id,
        slug: row.slug,
        title: row.title_ru,
        summary: row.summary,
        body: row.content_markdown,
        series: row.series_slug,
        country: row.country_slug,
        type: "episode",
        url: `/episodes/${row.slug}`
      };
    case "character":
      return {
        id: row.id,
        slug: row.slug,
        title: row.name_ru,
        summary: row.description,
        body: row.bio_markdown,
        type: "character",
        url: `/characters/${row.slug}`
      };
    case "atlas_entry":
      return {
        id: row.id,
        slug: row.slug,
        title: row.title_ru,
        summary: row.summary,
        body: row.content_markdown,
        kind: row.kind,
        type: "atlas_entry",
        url: `/atlas/${row.slug}`
      };
    case "episode_series":
      return {
        id: row.id,
        slug: row.slug,
        title: row.title_ru,
        summary: row.summary,
        type: "episode_series",
        url: `/episodes?series=${row.slug}`
      };
    case "country":
      return {
        id: row.id,
        slug: row.slug,
        title: row.title_ru,
        type: "country",
        url: `/atlas/${row.slug}`
      };
    case "location":
      return {
        id: row.id,
        slug: row.slug,
        title: row.title_ru,
        summary: row.summary,
        body: row.description_markdown,
        type: "location",
        url: `/atlas/${row.slug}`
      };
    default:
      return null;
  }
}

const collectionMap: Record<string, string> = {
  episode: "episodes",
  character: "characters",
  atlas_entry: "atlas_entries",
  episode_series: "episode_series",
  country: "countries",
  location: "locations"
};

async function processQueue() {
  if (!typesenseClient) {
    console.error("Typesense is not configured.");
    process.exit(1);
  }

  await ensureCollections();
  await syncSynonyms();

  while (true) {
    const result = await pool.query(
      `SELECT * FROM search_queue
       WHERE status = 'pending' AND next_run_at <= now()
       ORDER BY id ASC
       LIMIT 20`
    );

    if (result.rows.length === 0) break;

    for (const item of result.rows) {
      try {
        const collection = collectionMap[item.entity_type];
        if (!collection) {
          throw new Error(`Unknown collection for entity_type=${item.entity_type}`);
        }

        if (item.action === "delete") {
          await typesenseClient.collections(collection).documents(item.entity_id).delete();
        } else {
          const entityResult = await fetchEntity(item.entity_type, item.entity_id);
          const row = entityResult.rows[0];
          if (!row) {
            await pool.query(
              "UPDATE search_queue SET status = 'done', updated_at = now() WHERE id = $1",
              [item.id]
            );
            continue;
          }
          const doc = await buildDocument(item.entity_type, row);
          if (doc) {
            await typesenseClient.collections(collection).documents().upsert(doc);
          }
        }

        await pool.query(
          "UPDATE search_queue SET status = 'done', updated_at = now() WHERE id = $1",
          [item.id]
        );
      } catch (error: any) {
        const attempts = item.attempts + 1;
        const nextRun = new Date(Date.now() + Math.min(60000, attempts * 5000));
        await pool.query(
          "UPDATE search_queue SET attempts = $1, next_run_at = $2, last_error = $3, updated_at = now() WHERE id = $4",
          [attempts, nextRun, error.message ?? String(error), item.id]
        );
      }
    }
  }
}

processQueue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
