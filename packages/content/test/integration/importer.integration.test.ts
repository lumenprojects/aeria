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
title_ru: Test Country
flag_colors:
  - "#111111"
  - "#eeeeee"
---

# Test Country
`
  );

  await writeFile(
    rootDir,
    `content/locations/integration-${token}-location.md`,
    `---
slug: ${locationSlug}
title_ru: Test Location
country_slug: ${countrySlug}
summary: Location used by integration tests.
avatar_asset_path: /assets/images/locations/${locationSlug}.png
---

# Test Location
`
  );

  await writeFile(
    rootDir,
    `content/series/integration-${token}-series.md`,
    `---
slug: ${seriesSlug}
title_ru: Test Series
brand_color: "#112233"
summary: Series used by integration tests.
---

# Test Series
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
title_ru: Test Episode
summary: Episode used by integration tests.
characters:
  - ${episodeCharacterSlug}
locations:
  - ${locationSlug}
published_at: "2026-03-04T00:00:00Z"
---

# Test Episode

Body for dry-run and import verification.
`
  );

  await writeFile(
    rootDir,
    `content/characters/integration-${token}-character.md`,
    `---
slug: ${characterSlug}
name_ru: Test Character
avatar_asset_path: /assets/images/characters/${characterSlug}.png
affiliation_slug: ${atlasMainSlug}
country_slug: ${countrySlug}
tagline: Test tagline
gender: unknown
race: human
height_cm: 170
age: 20
orientation: unknown
mbti: INTJ
favorite_food: tea
quirks:
  - "Quirk 1"
rumors:
  - text: "Rumor 1"
    author_name: "Witness"
    source_type: atlas_entry
    source_slug: ${atlasMainSlug}
published_at: "2026-03-04T00:00:00Z"
---

# Test Character
`
  );

  await writeFile(
    rootDir,
    `content/atlas/integration-${token}-atlas-main.md`,
    `---
slug: ${atlasMainSlug}
kind: social
title_ru: Test Affiliation
avatar_asset_path: /assets/images/atlas/${atlasMainSlug}.png
country_slug: ${countrySlug}
location_slug: ${locationSlug}
links:
  - type: episode
    slug: ${episodeSlug}
  - type: character
    slug: ${characterSlug}
---

# Test Affiliation
`
  );

  if (options.includeExtraAtlas ?? true) {
    await writeFile(
      rootDir,
      `content/atlas/integration-${token}-atlas-extra.md`,
      `---
slug: ${atlasExtraSlug}
kind: object
title_ru: Temporary Object
summary: File used to verify archive policy.
---

# Temporary Object
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
