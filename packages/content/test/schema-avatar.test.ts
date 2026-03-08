import test from "node:test";
import assert from "node:assert/strict";
import { atlasSchema, characterSchema, locationSchema } from "../src/schema.js";

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
