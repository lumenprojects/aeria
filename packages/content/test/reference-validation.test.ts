import test from "node:test";
import assert from "node:assert/strict";
import { collectLocalMissingReferences } from "../src/reference-validation.js";

test("collectLocalMissingReferences returns empty sets for consistent references", () => {
  const countries = [{ slug: "fr", frontmatter: { slug: "fr", title_ru: "Франция" } }];
  const locations = [{ slug: "paris", frontmatter: { slug: "paris", title_ru: "Париж", country_slug: "fr" } }];
  const series = [{ slug: "series-1", frontmatter: { slug: "series-1", title_ru: "Серия 1" } }];
  const episodes = [
    {
      slug: "ep-1",
      frontmatter: {
        slug: "ep-1",
        series_slug: "series-1",
        country_slug: "fr",
        episode_number: 1,
        global_order: 1,
        title_ru: "Глава 1",
        characters: ["hero-1"],
        locations: ["paris"]
      }
    }
  ];
  const characters = [
    {
      slug: "hero-1",
      frontmatter: {
        slug: "hero-1",
        name_ru: "Герой",
        birth_country_slug: "fr",
        affiliation_slug: "guild-1"
      }
    }
  ];
  const atlas = [
    {
      slug: "guild-1",
      frontmatter: {
        slug: "guild-1",
        kind: "social",
        title_ru: "Гильдия",
        country_slug: "fr",
        location_slug: "paris",
        links: [
          { type: "episode", slug: "ep-1" },
          { type: "character", slug: "hero-1" }
        ]
      }
    }
  ];

  const missing = collectLocalMissingReferences(countries, locations, series, episodes, characters, atlas);

  assert.equal(missing.countries.size, 0);
  assert.equal(missing.locations.size, 0);
  assert.equal(missing.series.size, 0);
  assert.equal(missing.episodes.size, 0);
  assert.equal(missing.characters.size, 0);
  assert.equal(missing.atlas.size, 0);
});

test("collectLocalMissingReferences aggregates unknown slugs by entity", () => {
  const countries: Array<{ slug: string; frontmatter: { slug: string; title_ru: string } }> = [];
  const locations: Array<{
    slug: string;
    frontmatter: { slug: string; title_ru: string; country_slug?: string };
  }> = [];
  const series: Array<{ slug: string; frontmatter: { slug: string; title_ru: string } }> = [];
  const episodes = [
    {
      slug: "ep-404",
      frontmatter: {
        slug: "ep-404",
        series_slug: "series-missing",
        country_slug: "country-missing",
        episode_number: 1,
        global_order: 1,
        title_ru: "Broken",
        characters: ["char-missing"],
        locations: ["loc-missing"]
      }
    }
  ];
  const characters = [
    {
      slug: "char-1",
      frontmatter: {
        slug: "char-1",
        name_ru: "Name",
        affiliation_slug: "atlas-missing",
        birth_country_slug: "country-missing"
      }
    }
  ];
  const atlas = [
    {
      slug: "atlas-1",
      frontmatter: {
        slug: "atlas-1",
        kind: "other",
        title_ru: "Entry",
        country_slug: "country-missing",
        location_slug: "loc-missing",
        links: [
          { type: "episode", slug: "ep-missing" },
          { type: "character", slug: "char-missing" },
          { type: "atlas_entry", slug: "atlas-missing" },
          { type: "episode_series", slug: "series-missing" },
          { type: "country", slug: "country-missing" },
          { type: "location", slug: "loc-missing" }
        ]
      }
    }
  ];

  const missing = collectLocalMissingReferences(countries, locations, series, episodes, characters, atlas);

  assert.deepEqual([...missing.countries].sort(), ["country-missing"]);
  assert.deepEqual([...missing.locations].sort(), ["loc-missing"]);
  assert.deepEqual([...missing.series].sort(), ["series-missing"]);
  assert.deepEqual([...missing.episodes].sort(), ["ep-missing"]);
  assert.deepEqual([...missing.characters].sort(), ["char-missing"]);
  assert.deepEqual([...missing.atlas].sort(), ["atlas-missing"]);
});
