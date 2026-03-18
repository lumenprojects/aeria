import type {
  AtlasFrontmatter,
  CharacterFrontmatter,
  CountryFrontmatter,
  EpisodeFrontmatter,
  LocationFrontmatter,
  SeriesFrontmatter
} from "./schema.js";

type FileWithFrontmatter<T extends { slug: string }> = {
  slug: string;
  frontmatter: T;
};

export type MissingReferenceBuckets = {
  countries: Set<string>;
  locations: Set<string>;
  series: Set<string>;
  episodes: Set<string>;
  characters: Set<string>;
  atlas: Set<string>;
};

function collectQuoteCharacterReferences(
  quotes:
    | Array<
        | { text: string; character_slug: string }
        | { text: string; speaker_name: string; speaker_meta?: string | null }
      >
    | undefined,
  characterSlugs: Set<string>,
  missing: MissingReferenceBuckets
) {
  for (const quote of quotes ?? []) {
    if ("character_slug" in quote && !characterSlugs.has(quote.character_slug)) {
      missing.characters.add(quote.character_slug);
    }
  }
}

export function collectLocalMissingReferences(
  countries: FileWithFrontmatter<CountryFrontmatter>[],
  locations: FileWithFrontmatter<LocationFrontmatter>[],
  series: FileWithFrontmatter<SeriesFrontmatter>[],
  episodes: FileWithFrontmatter<EpisodeFrontmatter>[],
  characters: FileWithFrontmatter<CharacterFrontmatter>[],
  atlas: FileWithFrontmatter<AtlasFrontmatter>[]
): MissingReferenceBuckets {
  const countrySlugs = new Set(countries.map((item) => item.slug));
  const locationSlugs = new Set(locations.map((item) => item.slug));
  const seriesSlugs = new Set(series.map((item) => item.slug));
  const episodeSlugs = new Set(episodes.map((item) => item.slug));
  const characterSlugs = new Set(characters.map((item) => item.slug));
  const atlasSlugs = new Set(atlas.map((item) => item.slug));

  const missing: MissingReferenceBuckets = {
    countries: new Set(),
    locations: new Set(),
    series: new Set(),
    episodes: new Set(),
    characters: new Set(),
    atlas: new Set()
  };

  for (const location of locations) {
    if (location.frontmatter.country_slug && !countrySlugs.has(location.frontmatter.country_slug)) {
      missing.countries.add(location.frontmatter.country_slug);
    }

    collectQuoteCharacterReferences(location.frontmatter.quotes, characterSlugs, missing);
  }

  for (const episode of episodes) {
    if (!seriesSlugs.has(episode.frontmatter.series_slug)) {
      missing.series.add(episode.frontmatter.series_slug);
    }

    if (!countrySlugs.has(episode.frontmatter.country_slug)) {
      missing.countries.add(episode.frontmatter.country_slug);
    }

    for (const characterSlug of episode.frontmatter.characters ?? []) {
      if (!characterSlugs.has(characterSlug)) {
        missing.characters.add(characterSlug);
      }
    }

    for (const locationSlug of episode.frontmatter.locations ?? []) {
      if (!locationSlugs.has(locationSlug)) {
        missing.locations.add(locationSlug);
      }
    }
  }

  for (const character of characters) {
    if (!countrySlugs.has(character.frontmatter.country_slug)) {
      missing.countries.add(character.frontmatter.country_slug);
    }

    if (character.frontmatter.affiliation_slug && !atlasSlugs.has(character.frontmatter.affiliation_slug)) {
      missing.atlas.add(character.frontmatter.affiliation_slug);
    }

    for (const rumor of character.frontmatter.rumors ?? []) {
      if (!rumor.source_type || !rumor.source_slug) {
        continue;
      }

      if (rumor.source_type === "character" && !characterSlugs.has(rumor.source_slug)) {
        missing.characters.add(rumor.source_slug);
      }

      if (rumor.source_type === "atlas_entry" && !atlasSlugs.has(rumor.source_slug)) {
        missing.atlas.add(rumor.source_slug);
      }
    }
  }

  for (const entry of atlas) {
    if (entry.frontmatter.country_slug && !countrySlugs.has(entry.frontmatter.country_slug)) {
      missing.countries.add(entry.frontmatter.country_slug);
    }

    if (entry.frontmatter.location_slug && !locationSlugs.has(entry.frontmatter.location_slug)) {
      missing.locations.add(entry.frontmatter.location_slug);
    }

    collectQuoteCharacterReferences(entry.frontmatter.quotes, characterSlugs, missing);

    for (const link of entry.frontmatter.links ?? []) {
      switch (link.type) {
        case "episode":
          if (!episodeSlugs.has(link.slug)) missing.episodes.add(link.slug);
          break;
        case "character":
          if (!characterSlugs.has(link.slug)) missing.characters.add(link.slug);
          break;
        case "atlas_entry":
          if (!atlasSlugs.has(link.slug)) missing.atlas.add(link.slug);
          break;
        case "episode_series":
          if (!seriesSlugs.has(link.slug)) missing.series.add(link.slug);
          break;
        case "country":
          if (!countrySlugs.has(link.slug)) missing.countries.add(link.slug);
          break;
        case "location":
          if (!locationSlugs.has(link.slug)) missing.locations.add(link.slug);
          break;
        default:
          break;
      }
    }
  }

  for (const country of countries) {
    collectQuoteCharacterReferences(country.frontmatter.quotes, characterSlugs, missing);
  }

  return missing;
}
