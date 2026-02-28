import { z } from "zod";

export const atlasKindValues = [
  "geography",
  "social",
  "history",
  "belief",
  "object",
  "event",
  "other"
] as const;

export const entityTypeValues = [
  "episode",
  "character",
  "atlas_entry",
  "episode_series",
  "country",
  "location"
] as const;

export const AtlasKind = z.enum(atlasKindValues);
export const EntityType = z.enum(entityTypeValues);

export const EpisodeSeriesDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title_ru: z.string(),
  brand_color: z.string().nullable(),
  summary: z.string().nullable()
});

export const CountryDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title_ru: z.string(),
  flag_emoji: z.string().nullable(),
  flag_asset_path: z.string().nullable(),
  flag_colors: z.array(z.string()).nullable()
});

export const LocationDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title_ru: z.string(),
  country_id: z.string().uuid().nullable(),
  summary: z.string().nullable(),
  description_markdown: z.string().nullable()
});

export const EpisodeDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  series_id: z.string().uuid(),
  country_id: z.string().uuid(),
  episode_number: z.number(),
  global_order: z.number(),
  title_native: z.string().nullable(),
  title_ru: z.string(),
  summary: z.string().nullable(),
  content_markdown: z.string().nullable(),
  reading_minutes: z.number().int().nullable(),
  published_at: z.string().datetime().nullable()
});

export const CharacterDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name_ru: z.string(),
  name_native: z.string().nullable(),
  affiliation_id: z.string().uuid().nullable(),
  gender: z.string().nullable(),
  race: z.string().nullable(),
  height_cm: z.number().int().nullable(),
  age: z.number().int().nullable(),
  birth_country_id: z.string().uuid().nullable(),
  favorite_food: z.string().nullable(),
  orientation: z.string().nullable(),
  description: z.string().nullable(),
  quote: z.string().nullable(),
  bio_markdown: z.string().nullable(),
  stats: z.record(z.any()).nullable(),
  published_at: z.string().datetime().nullable()
});

export const AtlasEntryDTO = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  summary: z.string().nullable(),
  content_markdown: z.string().nullable(),
  country_id: z.string().uuid().nullable(),
  location_id: z.string().uuid().nullable(),
  published_at: z.string().datetime().nullable()
});

export const SearchResultDTO = z.object({
  type: EntityType,
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string()
});

export const PaginatedDTO = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int()
  });

export type EpisodeSeriesDTO = z.infer<typeof EpisodeSeriesDTO>;
export type EpisodeDTO = z.infer<typeof EpisodeDTO>;
export type CharacterDTO = z.infer<typeof CharacterDTO>;
export type AtlasEntryDTO = z.infer<typeof AtlasEntryDTO>;
export type CountryDTO = z.infer<typeof CountryDTO>;
export type LocationDTO = z.infer<typeof LocationDTO>;
export type SearchResultDTO = z.infer<typeof SearchResultDTO>;
