import test from "node:test";
import assert from "node:assert/strict";
import { characterSchema, worldSchema } from "../src/schema.js";

test("character schema requires avatar_asset_path", () => {
  const result = characterSchema.safeParse({
    slug: "character-1",
    name_ru: "Character 1",
    country_slug: "country-1"
  });

  assert.equal(result.success, false);
});

test("avatar_asset_path must be rooted in /assets", () => {
  const result = characterSchema.safeParse({
    slug: "character-1",
    name_ru: "Character 1",
    country_slug: "country-1",
    avatar_asset_path: "assets/images/character-1.png"
  });

  assert.equal(result.success, false);
});

test("world avatar_asset_path is optional but validated when provided", () => {
  const validWorld = worldSchema.safeParse({
    slug: "world-1",
    type: "location",
    title_ru: "World 1",
    avatar_asset_path: "/assets/images/world-1.png",
    sections: []
  });
  assert.equal(validWorld.success, true);

  const invalidWorld = worldSchema.safeParse({
    slug: "world-1",
    type: "location",
    title_ru: "World 1",
    avatar_asset_path: "../world.png",
    sections: []
  });
  assert.equal(invalidWorld.success, false);
});

test("world schema accepts sections, facts and quotes", () => {
  const result = worldSchema.safeParse({
    slug: "atlas-1",
    type: "organization",
    title_ru: "Atlas 1",
    sections: [
      {
        key: "social",
        title_ru: "Социальное",
        fact: {
          title: "Интересный факт",
          text: "После полуночи полки звучат иначе."
        },
        quotes: [
          {
            text: "После полуночи полки звучат иначе.",
            character_slug: "character-1"
          }
        ]
      }
    ]
  });

  assert.equal(result.success, true);
});

test("world schema rejects duplicate sections and too many quotes", () => {
  const duplicateSections = worldSchema.safeParse({
    slug: "atlas-1",
    type: "organization",
    title_ru: "Atlas 1",
    sections: [
      { key: "social", title_ru: "Социальное" },
      { key: "social", title_ru: "Ещё социальное" }
    ]
  });
  assert.equal(duplicateSections.success, false);

  const tooManyQuotes = worldSchema.safeParse({
    slug: "atlas-1",
    type: "organization",
    title_ru: "Atlas 1",
    sections: [
      {
        key: "social",
        title_ru: "Социальное",
        quotes: [
          { text: "1", speaker_name: "A" },
          { text: "2", speaker_name: "B" },
          { text: "3", speaker_name: "C" },
          { text: "4", speaker_name: "D" }
        ]
      }
    ]
  });
  assert.equal(tooManyQuotes.success, false);
});

test("character rumor source fields must be provided together", () => {
  const result = characterSchema.safeParse({
    slug: "character-1",
    name_ru: "Character 1",
    country_slug: "country-1",
    avatar_asset_path: "/assets/images/character-1.png",
    rumors: [
      {
        text: "Rumor",
        author_name: "Witness",
        source_type: "character"
      }
    ]
  });

  assert.equal(result.success, false);
});

test("home featured character requires intro fields", () => {
  const result = characterSchema.safeParse({
    slug: "character-1",
    name_ru: "Character 1",
    country_slug: "country-1",
    avatar_asset_path: "/assets/images/character-1.png",
    home_featured: true
  });

  assert.equal(result.success, false);
});
