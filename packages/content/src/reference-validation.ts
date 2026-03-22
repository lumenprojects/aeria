import type {
  CharacterFrontmatter,
  EpisodeFrontmatter,
  SeriesFrontmatter,
  WorldFrontmatter
} from "./schema.js";

type FileWithFrontmatter<T extends { slug: string }> = {
  slug: string;
  frontmatter: T;
};

export type MissingReferenceBuckets = {
  atlas_entities: Set<string>;
  series: Set<string>;
  episodes: Set<string>;
  characters: Set<string>;
  typeViolations: string[];
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

function validateWorldType(
  worldBySlug: Map<string, WorldFrontmatter>,
  slug: string,
  expected: Array<WorldFrontmatter["type"]>,
  context: string,
  missing: MissingReferenceBuckets
) {
  const target = worldBySlug.get(slug);
  if (!target) {
    missing.atlas_entities.add(slug);
    return;
  }

  if (!expected.includes(target.type)) {
    missing.typeViolations.push(
      `${context}: expected ${expected.join(" | ")} but found ${target.type} (${slug})`
    );
  }
}

export function collectLocalMissingReferences(
  world: FileWithFrontmatter<WorldFrontmatter>[],
  series: FileWithFrontmatter<SeriesFrontmatter>[],
  episodes: FileWithFrontmatter<EpisodeFrontmatter>[],
  characters: FileWithFrontmatter<CharacterFrontmatter>[]
): MissingReferenceBuckets {
  const worldBySlug = new Map(world.map((item) => [item.slug, item.frontmatter]));
  const seriesSlugs = new Set(series.map((item) => item.slug));
  const episodeSlugs = new Set(episodes.map((item) => item.slug));
  const characterSlugs = new Set(characters.map((item) => item.slug));

  const missing: MissingReferenceBuckets = {
    atlas_entities: new Set(),
    series: new Set(),
    episodes: new Set(),
    characters: new Set(),
    typeViolations: []
  };

  for (const entry of world) {
    if (entry.frontmatter.country_slug) {
      validateWorldType(
        worldBySlug,
        entry.frontmatter.country_slug,
        ["country"],
        `[world:${entry.slug}] country_slug`,
        missing
      );
    }

    if (entry.frontmatter.location_slug) {
      validateWorldType(
        worldBySlug,
        entry.frontmatter.location_slug,
        ["location"],
        `[world:${entry.slug}] location_slug`,
        missing
      );
    }

    for (const section of entry.frontmatter.sections ?? []) {
      collectQuoteCharacterReferences(section.quotes, characterSlugs, missing);
    }

    for (const link of entry.frontmatter.links ?? []) {
      switch (link.type) {
        case "episode":
          if (!episodeSlugs.has(link.slug)) missing.episodes.add(link.slug);
          break;
        case "character":
          if (!characterSlugs.has(link.slug)) missing.characters.add(link.slug);
          break;
        case "episode_series":
          if (!seriesSlugs.has(link.slug)) missing.series.add(link.slug);
          break;
        case "atlas_entity":
          if (!worldBySlug.has(link.slug)) missing.atlas_entities.add(link.slug);
          break;
        default:
          break;
      }
    }
  }

  for (const episode of episodes) {
    if (!seriesSlugs.has(episode.frontmatter.series_slug)) {
      missing.series.add(episode.frontmatter.series_slug);
    }

    validateWorldType(
      worldBySlug,
      episode.frontmatter.country_slug,
      ["country"],
      `[episode:${episode.slug}] country_slug`,
      missing
    );

    for (const characterSlug of episode.frontmatter.characters ?? []) {
      if (!characterSlugs.has(characterSlug)) {
        missing.characters.add(characterSlug);
      }
    }

    for (const locationSlug of episode.frontmatter.locations ?? []) {
      validateWorldType(
        worldBySlug,
        locationSlug,
        ["location"],
        `[episode:${episode.slug}] locations`,
        missing
      );
    }
  }

  for (const character of characters) {
    validateWorldType(
      worldBySlug,
      character.frontmatter.country_slug,
      ["country"],
      `[character:${character.slug}] country_slug`,
      missing
    );

    if (character.frontmatter.affiliation_slug && !worldBySlug.has(character.frontmatter.affiliation_slug)) {
      missing.atlas_entities.add(character.frontmatter.affiliation_slug);
    }

    for (const rumor of character.frontmatter.rumors ?? []) {
      if (!rumor.source_type || !rumor.source_slug) {
        continue;
      }

      if (rumor.source_type === "character" && !characterSlugs.has(rumor.source_slug)) {
        missing.characters.add(rumor.source_slug);
      }

      if (rumor.source_type === "atlas_entity" && !worldBySlug.has(rumor.source_slug)) {
        missing.atlas_entities.add(rumor.source_slug);
      }
    }
  }

  return missing;
}
