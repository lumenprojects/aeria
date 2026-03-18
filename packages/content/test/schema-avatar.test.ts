import test from "node:test";
import assert from "node:assert/strict";
import { atlasSchema, characterSchema, countrySchema, locationSchema } from "../src/schema.js";

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

test("location and atlas avatar_asset_path are optional but validated when provided", () => {
  const validLocation = locationSchema.safeParse({
    slug: "location-1",
    title_ru: "Location 1",
    avatar_asset_path: "/assets/images/location-1.png"
  });
  assert.equal(validLocation.success, true);

  const invalidAtlas = atlasSchema.safeParse({
    slug: "atlas-1",
    kind: "other",
    title_ru: "Atlas 1",
    avatar_asset_path: "../atlas.png"
  });
  assert.equal(invalidAtlas.success, false);
});

test("location and atlas schema accept fact and quotes", () => {
  const validLocation = locationSchema.safeParse({
    slug: "location-1",
    title_ru: "Location 1",
    fact: {
      title: "Примета",
      text: "Вечером окна здесь теплеют раньше мостовой."
    },
    quotes: [
      {
        text: "Здесь всегда слышно, как город думает.",
        speaker_name: "Смотритель моста"
      }
    ]
  });
  assert.equal(validLocation.success, true);

  const result = atlasSchema.safeParse({
    slug: "atlas-1",
    kind: "social",
    title_ru: "Atlas 1",
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
  });

  assert.equal(result.success, true);
});

test("country schema rejects quotes and quote source must be exclusive", () => {
  const invalidCountry = countrySchema.safeParse({
    slug: "country-1",
    title_ru: "Country 1",
    quotes: [
      {
        text: "Такое не должно пройти.",
        speaker_name: "Наблюдатель"
      }
    ]
  });
  assert.equal(invalidCountry.success, false);

  const invalidQuoteShape = locationSchema.safeParse({
    slug: "location-1",
    title_ru: "Location 1",
    quotes: [
      {
        text: "Слишком много источников сразу.",
        character_slug: "character-1",
        speaker_name: "Наблюдатель"
      }
    ]
  });
  assert.equal(invalidQuoteShape.success, false);

  const tooManyQuotes = atlasSchema.safeParse({
    slug: "atlas-1",
    kind: "social",
    title_ru: "Atlas 1",
    quotes: [
      { text: "1", speaker_name: "A" },
      { text: "2", speaker_name: "B" },
      { text: "3", speaker_name: "C" },
      { text: "4", speaker_name: "D" }
    ]
  });
  assert.equal(tooManyQuotes.success, false);
});

test("geography atlas entries reject quotes", () => {
  const result = atlasSchema.safeParse({
    slug: "atlas-1",
    kind: "geography",
    title_ru: "Atlas 1",
    quotes: [
      {
        text: "Такой голос здесь быть не должен.",
        speaker_name: "Наблюдатель"
      }
    ]
  });

  assert.equal(result.success, false);
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
