import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";

const shouldRunIntegration = process.env.CONTENT_INTEGRATION === "1";

type FixtureOptions = {
  brokenCharacterReference?: boolean;
  includeExtraAtlas?: boolean;
};

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeFile(rootDir: string, relativePath: string, content: string) {
  const fullPath = path.join(rootDir, relativePath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, content, "utf8");
}

async function writeFixture(rootDir: string, token: string, options: FixtureOptions = {}) {
  const prefix = `it-${token}`;
  const tokenKey = token.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "1";
  const globalOrder = 100000 + (Number.parseInt(tokenKey, 36) % 900000000);
  const countrySlug = `${prefix}-country`;
  const locationSlug = `${prefix}-location`;
  const seriesSlug = `${prefix}-series`;
  const episodeSlug = `${prefix}-episode`;
  const characterSlug = `${prefix}-character`;
  const atlasMainSlug = `${prefix}-atlas-main`;
  const atlasExtraSlug = `${prefix}-atlas-extra`;
  const episodeCharacterSlug = options.brokenCharacterReference ? `${prefix}-character-missing` : characterSlug;

  await writeFile(
    rootDir,
    "content/schema.json",
    JSON.stringify(
      {
        schema_version: 1,
        format: "aeria-content",
        updated_at: "2026-03-04"
      },
      null,
      2
    )
  );

  await writeFile(
    rootDir,
    `content/countries/integration-${token}-country.md`,
    `---
slug: ${countrySlug}
title_ru: Тестовая страна
flag_colors:
  - "#111111"
  - "#eeeeee"
---

# Тестовая страна
`
  );

  await writeFile(
    rootDir,
    `content/locations/integration-${token}-location.md`,
    `---
slug: ${locationSlug}
title_ru: Тестовая локация
country_slug: ${countrySlug}
summary: Локация для интеграционного теста.
avatar_asset_path: /assets/images/locations/${locationSlug}.png
---

# Тестовая локация
`
  );

  await writeFile(
    rootDir,
    `content/series/integration-${token}-series.md`,
    `---
slug: ${seriesSlug}
title_ru: Тестовая серия
brand_color: "#112233"
summary: Серия для интеграционного теста.
---

# Тестовая серия
`
  );

  await writeFile(
    rootDir,
    `content/episodes/integration-${token}-episode.md`,
    `---
slug: ${episodeSlug}
series_slug: ${seriesSlug}
country_slug: ${countrySlug}
episode_number: 1
global_order: ${globalOrder}
title_ru: Тестовый эпизод
summary: Эпизод для интеграционного теста.
characters:
  - ${episodeCharacterSlug}
locations:
  - ${locationSlug}
published_at: "2026-03-04T00:00:00Z"
---

# Тестовый эпизод

Текст эпизода для проверки dry-run и import.
`
  );

  await writeFile(
    rootDir,
    `content/characters/integration-${token}-character.md`,
    `---
slug: ${characterSlug}
name_ru: Тестовый персонаж
avatar_asset_path: /assets/images/characters/${characterSlug}.png
affiliation_slug: ${atlasMainSlug}
birth_country_slug: ${countrySlug}
traits:
  - "Примета 1"
rumors:
  - "Слух 1"
---

# Тестовый персонаж
`
  );

  await writeFile(
    rootDir,
    `content/atlas/integration-${token}-atlas-main.md`,
    `---
slug: ${atlasMainSlug}
kind: social
title_ru: Тестовая принадлежность
avatar_asset_path: /assets/images/atlas/${atlasMainSlug}.png
country_slug: ${countrySlug}
location_slug: ${locationSlug}
links:
  - type: episode
    slug: ${episodeSlug}
  - type: character
    slug: ${characterSlug}
---

# Тестовая принадлежность
`
  );

  if (options.includeExtraAtlas ?? true) {
    await writeFile(
      rootDir,
      `content/atlas/integration-${token}-atlas-extra.md`,
      `---
slug: ${atlasExtraSlug}
kind: object
title_ru: Временный объект
summary: Файл нужен для проверки archive policy.
---

# Временный объект
`
    );
  }
}

test(
  "importer integration: unchanged hash, archive policy and reference validation",
  { skip: !shouldRunIntegration },
  async () => {
    const { runImport } = await import("../../src/index.js");
    const { pool } = await import("../../src/db.js");
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "aeria-content-it-"));

    try {
      const token = Date.now().toString(36);
      await writeFixture(tmpDir, token, { includeExtraAtlas: true });

      const first = await runImport({
        rootDir: tmpDir,
        dryRun: false,
        batchSize: 20,
        reindex: false
      });

      assert.equal(first.summary.countries.created, 1);
      assert.equal(first.summary.locations.created, 1);
      assert.equal(first.summary.series.created, 1);
      assert.equal(first.summary.episodes.created, 1);
      assert.equal(first.summary.characters.created, 1);
      assert.equal(first.summary.atlas.created, 2);

      const dry = await runImport({
        rootDir: tmpDir,
        dryRun: true,
        batchSize: 20,
        reindex: false
      });

      assert.equal(dry.summary.countries.unchanged, 1);
      assert.equal(dry.summary.locations.unchanged, 1);
      assert.equal(dry.summary.series.unchanged, 1);
      assert.equal(dry.summary.episodes.unchanged, 1);
      assert.equal(dry.summary.characters.unchanged, 1);
      assert.equal(dry.summary.atlas.unchanged, 2);

      await fs.unlink(path.join(tmpDir, "content", "atlas", `integration-${token}-atlas-extra.md`));

      const archived = await runImport({
        rootDir: tmpDir,
        dryRun: false,
        batchSize: 20,
        reindex: false
      });

      assert.equal(archived.summary.atlas.archived, 1);

      const brokenToken = `${token}-broken`;
      await writeFixture(tmpDir, brokenToken, { brokenCharacterReference: true, includeExtraAtlas: false });

      await assert.rejects(
        () =>
          runImport({
            rootDir: tmpDir,
            dryRun: false,
            batchSize: 20,
            reindex: false
          }),
        /Reference validation failed/
      );

      const brokenCountries = await pool.query(
        "SELECT COUNT(*)::int AS count FROM countries WHERE slug = $1",
        [`it-${brokenToken}-country`]
      );
      assert.equal(brokenCountries.rows[0]?.count ?? 0, 0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
      await pool.end();
    }
  }
);
