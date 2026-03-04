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

export const Uuid = z.string().uuid();
export const NullableUuid = Uuid.nullable();
export const NullableIsoDateTime = z.string().datetime().nullable();

export const PaginatedDTO = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int()
  });

export const EpisodeSeriesDTO = z.object({
  id: Uuid,
  slug: z.string(),
  title_ru: z.string(),
  brand_color: z.string().nullable(),
  summary: z.string().nullable()
});

export const CountryDTO = z.object({
  id: Uuid,
  slug: z.string(),
  title_ru: z.string(),
  flag_emoji: z.string().nullable(),
  flag_asset_path: z.string().nullable(),
  flag_colors: z.array(z.string()).nullable()
});

export const LocationDTO = z.object({
  id: Uuid,
  slug: z.string(),
  title_ru: z.string(),
  country_id: NullableUuid,
  summary: z.string().nullable(),
  description_markdown: z.string().nullable()
});

export const EpisodeDTO = z.object({
  id: Uuid,
  slug: z.string(),
  series_id: Uuid,
  country_id: Uuid,
  episode_number: z.number().int(),
  global_order: z.number().int(),
  title_native: z.string().nullable(),
  title_ru: z.string(),
  summary: z.string().nullable(),
  content_markdown: z.string().nullable(),
  reading_minutes: z.number().int().nullable(),
  published_at: NullableIsoDateTime
});

export const CharacterDTO = z.object({
  id: Uuid,
  slug: z.string(),
  name_ru: z.string(),
  name_native: z.string().nullable(),
  affiliation_id: NullableUuid,
  gender: z.string().nullable(),
  race: z.string().nullable(),
  height_cm: z.number().int().nullable(),
  age: z.number().int().nullable(),
  birth_country_id: NullableUuid,
  favorite_food: z.string().nullable(),
  orientation: z.string().nullable(),
  description: z.string().nullable(),
  quote: z.string().nullable(),
  bio_markdown: z.string().nullable(),
  stats: z.record(z.unknown()).nullable(),
  published_at: NullableIsoDateTime
});

export const AtlasEntryDTO = z.object({
  id: Uuid,
  slug: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  summary: z.string().nullable(),
  content_markdown: z.string().nullable(),
  country_id: NullableUuid,
  location_id: NullableUuid,
  published_at: NullableIsoDateTime
});

export const SearchResultDTO = z.object({
  type: EntityType,
  id: Uuid,
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  url: z.string()
});

export const ApiErrorDTO = z.object({
  error: z.string()
});

export const PaginationQueryDTO = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const EpisodesListQueryDTO = PaginationQueryDTO.extend({
  series: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional()
});

export const AtlasListQueryDTO = PaginationQueryDTO.extend({
  kind: AtlasKind.optional()
});

export const SearchQueryDTO = z.object({
  q: z.string().optional()
});

export const EpisodeListItemDTO = EpisodeDTO.omit({ content_markdown: true });

export const CharacterListItemDTO = z.object({
  id: Uuid,
  slug: z.string(),
  name_ru: z.string(),
  name_native: z.string().nullable(),
  description: z.string().nullable()
});

export const EpisodeCharacterLinkDTO = CharacterListItemDTO;

export const EpisodeLocationLinkDTO = z.object({
  id: Uuid,
  slug: z.string(),
  title_ru: z.string(),
  summary: z.string().nullable(),
  country_id: NullableUuid
});

export const CharacterTraitDTO = z.object({
  text: z.string(),
  sort_order: z.number().int()
});

export const AtlasLinkDTO = z.object({
  from_type: EntityType,
  from_id: Uuid,
  to_type: EntityType,
  to_id: Uuid,
  label: z.string().nullable()
});

export const SearchGroupDTO = z.object({
  type: EntityType,
  hits: z.array(SearchResultDTO)
});

export const SearchGroupsDTO = z.object({
  groups: z.array(SearchGroupDTO)
});

export const EpisodeDetailResponseDTO = z.object({
  episode: EpisodeDTO,
  series: EpisodeSeriesDTO.nullable(),
  country: CountryDTO.nullable(),
  characters: z.array(EpisodeCharacterLinkDTO),
  locations: z.array(EpisodeLocationLinkDTO)
});

export const CharacterDetailResponseDTO = z.object({
  character: CharacterDTO,
  traits: z.array(CharacterTraitDTO),
  rumors: z.array(CharacterTraitDTO),
  episodes: z.array(EpisodeListItemDTO)
});

export const AtlasDetailResponseDTO = z.object({
  entry: AtlasEntryDTO,
  links: z.array(AtlasLinkDTO)
});

export const SeriesDetailResponseDTO = z.object({
  series: EpisodeSeriesDTO,
  episodes: z.array(EpisodeListItemDTO)
});

export const AtlasListItemDTO = z.object({
  id: Uuid,
  slug: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  summary: z.string().nullable(),
  country_id: NullableUuid,
  location_id: NullableUuid
});

export const PaginatedEpisodesResponseDTO = PaginatedDTO(EpisodeListItemDTO);
export const PaginatedSeriesResponseDTO = PaginatedDTO(EpisodeSeriesDTO);
export const PaginatedCharactersResponseDTO = PaginatedDTO(CharacterListItemDTO);
export const PaginatedAtlasResponseDTO = PaginatedDTO(AtlasListItemDTO);
export const PaginatedCountriesResponseDTO = PaginatedDTO(CountryDTO);
export const PaginatedLocationsResponseDTO = PaginatedDTO(LocationDTO);

export type EpisodeSeriesDTO = z.infer<typeof EpisodeSeriesDTO>;
export type EpisodeDTO = z.infer<typeof EpisodeDTO>;
export type CharacterDTO = z.infer<typeof CharacterDTO>;
export type AtlasEntryDTO = z.infer<typeof AtlasEntryDTO>;
export type CountryDTO = z.infer<typeof CountryDTO>;
export type LocationDTO = z.infer<typeof LocationDTO>;
export type SearchResultDTO = z.infer<typeof SearchResultDTO>;
