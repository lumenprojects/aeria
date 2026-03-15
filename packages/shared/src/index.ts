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

export const characterRumorSourceTypeValues = ["character", "atlas_entry"] as const;
export const characterSortValues = ["name_asc", "name_desc"] as const;

export const AtlasKind = z.enum(atlasKindValues);
export const EntityType = z.enum(entityTypeValues);
export const CharacterRumorSourceType = z.enum(characterRumorSourceTypeValues);
export const CharacterSort = z.enum(characterSortValues);

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
  url: z.string(),
  title_ru: z.string(),
  brand_color: z.string().nullable(),
  summary: z.string().nullable()
});

export const CountryDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  flag_colors: z.array(z.string()).nullable()
});

export const CountryFlagDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  flag_colors: z.array(z.string()).nullable()
});

export const LocationDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  country_id: NullableUuid,
  summary: z.string().nullable(),
  description_markdown: z.string().nullable(),
  avatar_asset_path: z.string().nullable()
});

export const EpisodeDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
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

export const AtlasReferenceDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  avatar_asset_path: z.string().nullable()
});

export const CharacterDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string(),
  name_native: z.string().nullable(),
  affiliation_id: NullableUuid,
  country_id: NullableUuid,
  tagline: z.string().nullable(),
  gender: z.string().nullable(),
  race: z.string().nullable(),
  height_cm: z.number().int().nullable(),
  age: z.number().int().nullable(),
  orientation: z.string().nullable(),
  mbti: z.string().nullable(),
  favorite_food: z.string().nullable(),
  bio_markdown: z.string().nullable(),
  published_at: NullableIsoDateTime
});

export const AtlasEntryDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  summary: z.string().nullable(),
  content_markdown: z.string().nullable(),
  avatar_asset_path: z.string().nullable(),
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

export const CharactersListQueryDTO = PaginationQueryDTO.extend({
  q: z.string().optional(),
  country: z.string().optional(),
  affiliation: z.string().optional(),
  sort: CharacterSort.optional()
});

export const SearchQueryDTO = z.object({
  q: z.string().optional()
});

export const EpisodeListItemDTO = EpisodeDTO.omit({ content_markdown: true }).extend({
  country: CountryFlagDTO
});

export const CharacterReferenceDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  name_native: z.string().nullable(),
  tagline: z.string().nullable()
});

export const CharacterListItemDTO = CharacterReferenceDTO.extend({
  avatar_asset_path: z.string(),
  country: CountryFlagDTO.nullable(),
  affiliation: AtlasReferenceDTO.nullable()
});

export const CharacterFactPersonDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string()
});

export const CharacterFactOfDayDTO = z.object({
  id: z.number().int(),
  fact_text: z.string(),
  comment_text: z.string(),
  subject_character: CharacterFactPersonDTO,
  comment_author_character: CharacterFactPersonDTO.nullable()
});

export const CharacterFactOfDayResponseDTO = z.object({
  fact_of_day: CharacterFactOfDayDTO.nullable()
});

export const EpisodeCharacterLinkDTO = CharacterReferenceDTO.extend({
  avatar_asset_path: z.string()
});

export const EpisodeLocationLinkDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  summary: z.string().nullable(),
  country_id: NullableUuid
});

export const CharacterQuirkDTO = z.object({
  text: z.string(),
  sort_order: z.number().int()
});

export const CharacterRumorSourceDTO = z.object({
  type: CharacterRumorSourceType,
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title: z.string(),
  avatar_asset_path: z.string().nullable()
});

export const CharacterRumorDTO = z.object({
  text: z.string(),
  author_name: z.string(),
  author_meta: z.string().nullable(),
  source: CharacterRumorSourceDTO.nullable(),
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
  country: CountryFlagDTO.nullable(),
  affiliation: AtlasReferenceDTO.nullable(),
  quirks: z.array(CharacterQuirkDTO),
  rumors: z.array(CharacterRumorDTO),
  episodes: z.array(EpisodeListItemDTO)
});

export const AtlasDetailResponseDTO = z.object({
  entry: AtlasEntryDTO,
  country: CountryFlagDTO.nullable(),
  links: z.array(AtlasLinkDTO)
});

export const SeriesDetailResponseDTO = z.object({
  series: EpisodeSeriesDTO,
  episodes: z.array(EpisodeListItemDTO)
});

export const AtlasListItemDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  kind: AtlasKind,
  title_ru: z.string(),
  summary: z.string().nullable(),
  country_id: NullableUuid,
  location_id: NullableUuid
});

export const HomeEpisodeSeriesDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  brand_color: z.string().nullable()
});

export const HomeEpisodeParticipantDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string()
});

export const HomeLatestEpisodeDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  episode_number: z.number().int(),
  global_order: z.number().int(),
  title_native: z.string().nullable(),
  title_ru: z.string(),
  summary: z.string().nullable(),
  reading_minutes: z.number().int().nullable(),
  published_at: NullableIsoDateTime,
  country: CountryFlagDTO,
  series: HomeEpisodeSeriesDTO.nullable(),
  participants: z.array(HomeEpisodeParticipantDTO)
});

export const HomeAboutProfileDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string(),
  home_intro_title: z.string(),
  home_intro_markdown: z.string()
});

export const HomeWorldQuoteDTO = z.object({
  id: z.number().int(),
  quote: z.string(),
  source: z.string()
});

export const HomeWorldQuoteResponseDTO = z.object({
  world_quote: HomeWorldQuoteDTO.nullable()
});

export const HomeSnapshotDTO = z.object({
  latest_episode: HomeLatestEpisodeDTO.nullable(),
  about_profile: HomeAboutProfileDTO.nullable(),
  world_quote: HomeWorldQuoteDTO.nullable()
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
export type CountryFlagDTO = z.infer<typeof CountryFlagDTO>;
export type LocationDTO = z.infer<typeof LocationDTO>;
export type CharacterReferenceDTO = z.infer<typeof CharacterReferenceDTO>;
export type CharacterListItemDTO = z.infer<typeof CharacterListItemDTO>;
export type PaginatedCharactersResponseDTO = z.infer<typeof PaginatedCharactersResponseDTO>;
export type EpisodeCharacterLinkDTO = z.infer<typeof EpisodeCharacterLinkDTO>;
export type EpisodeDetailResponseDTO = z.infer<typeof EpisodeDetailResponseDTO>;
export type SearchResultDTO = z.infer<typeof SearchResultDTO>;
export type HomeSnapshotDTO = z.infer<typeof HomeSnapshotDTO>;
export type HomeLatestEpisodeDTO = z.infer<typeof HomeLatestEpisodeDTO>;
export type HomeAboutProfileDTO = z.infer<typeof HomeAboutProfileDTO>;
export type HomeWorldQuoteDTO = z.infer<typeof HomeWorldQuoteDTO>;
export type HomeWorldQuoteResponseDTO = z.infer<typeof HomeWorldQuoteResponseDTO>;
export type CharacterSort = z.infer<typeof CharacterSort>;
export type CharacterFactPersonDTO = z.infer<typeof CharacterFactPersonDTO>;
export type CharacterFactOfDayDTO = z.infer<typeof CharacterFactOfDayDTO>;
export type CharacterFactOfDayResponseDTO = z.infer<typeof CharacterFactOfDayResponseDTO>;
