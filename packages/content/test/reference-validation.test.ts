import test from "node:test";
import assert from "node:assert/strict";
import { collectLocalMissingReferences } from "../src/reference-validation.js";

test("collectLocalMissingReferences returns empty sets for consistent references", () => {
  const world = [
    { slug: "fr", frontmatter: { slug: "fr", type: "country", title_ru: "Франция", sections: [] } },
    {
      slug: "paris",
      frontmatter: {
        slug: "paris",
        type: "location",
        title_ru: "Париж",
        country_slug: "fr",
        sections: []
      }
    },
    {
      slug: "guild-1",
      frontmatter: {
        slug: "guild-1",
        type: "organization",
        title_ru: "Гильдия",
        country_slug: "fr",
        location_slug: "paris",
        sections: [
          {
            key: "social",
            title_ru: "Социальное",
            quotes: [{ text: "Герой отсюда не выходит незамеченным.", character_slug: "hero-1" }]
          }
        ],
        links: [
          { type: "episode", slug: "ep-1" },
          { type: "character", slug: "hero-1" }
        ]
      }
    }
  ];
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
        avatar_asset_path: "/assets/images/characters/hero-1.png",
        country_slug: "fr",
        affiliation_slug: "guild-1",
        rumors: [
          {
            text: "Rumor",
            author_name: "Witness",
            source_type: "atlas_entity",
            source_slug: "guild-1"
          }
        ]
      }
    }
  ];

  const missing = collectLocalMissingReferences(world, series, episodes, characters);

  assert.equal(missing.atlas_entities.size, 0);
  assert.equal(missing.series.size, 0);
  assert.equal(missing.episodes.size, 0);
  assert.equal(missing.characters.size, 0);
  assert.deepEqual(missing.typeViolations, []);
});

test("collectLocalMissingReferences aggregates unknown slugs and type mismatches", () => {
  const world = [
    {
      slug: "not-a-country",
      frontmatter: {
        slug: "not-a-country",
        type: "location",
        title_ru: "Не страна",
        sections: []
      }
    }
  ];
  const series: Array<{ slug: string; frontmatter: { slug: string; title_ru: string } }> = [];
  const episodes = [
    {
      slug: "ep-404",
      frontmatter: {
        slug: "ep-404",
        series_slug: "series-missing",
        country_slug: "not-a-country",
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
        avatar_asset_path: "/assets/images/characters/char-1.png",
        affiliation_slug: "atlas-missing",
        country_slug: "country-missing",
        rumors: [
          {
            text: "Rumor",
            author_name: "Witness",
            source_type: "character",
            source_slug: "char-missing"
          }
        ]
      }
    }
  ];

  const missing = collectLocalMissingReferences(world, series, episodes, characters);

  assert.deepEqual([...missing.atlas_entities].sort(), ["atlas-missing", "country-missing", "loc-missing"]);
  assert.deepEqual([...missing.series].sort(), ["series-missing"]);
  assert.deepEqual([...missing.characters].sort(), ["char-missing"]);
  assert.ok(
    missing.typeViolations.some((message) => message.includes("expected country") && message.includes("not-a-country"))
  );
});
