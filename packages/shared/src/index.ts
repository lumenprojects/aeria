import { z } from "zod";

export const atlasSectionValues = [
  "geography",
  "social",
  "history",
  "belief",
  "object",
  "event",
  "other"
] as const;

export const atlasEntityTypeValues = [
  "country",
  "location",
  "organization",
  "object",
  "event",
  "belief",
  "concept",
  "other"
] as const;

export const entityTypeValues = [
  "episode",
  "character",
  "atlas_entity",
  "episode_series"
] as const;

export const characterRumorSourceTypeValues = ["character", "atlas_entity"] as const;
export const characterSortValues = ["name_asc", "name_desc"] as const;
export const episodeSortValues = ["oldest", "newest"] as const;
export const atlasCatalogSortValues = ["title_asc", "title_desc", "recent"] as const;
export const atlasQuoteSpeakerTypeValues = ["character", "world"] as const;

export const AtlasSection = z.enum(atlasSectionValues);
export const AtlasEntityType = z.enum(atlasEntityTypeValues);
export const EntityType = z.enum(entityTypeValues);
export const CharacterRumorSourceType = z.enum(characterRumorSourceTypeValues);
export const CharacterSort = z.enum(characterSortValues);
export const EpisodeSort = z.enum(episodeSortValues);
export const AtlasCatalogSort = z.enum(atlasCatalogSortValues);
export const AtlasQuoteSpeakerType = z.enum(atlasQuoteSpeakerTypeValues);

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

export const AtlasEntityReferenceDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  type: AtlasEntityType,
  title_ru: z.string(),
  summary: z.string().nullable(),
  avatar_asset_path: z.string().nullable(),
  flag_colors: z.array(z.string()).nullable()
});

export const EpisodeDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  series_id: Uuid,
  country_entity_id: Uuid,
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
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string(),
  name_native: z.string().nullable(),
  affiliation_entity_id: NullableUuid,
  country_entity_id: NullableUuid,
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
  country: z.string().trim().min(1).optional(),
  character: z.string().trim().min(1).optional(),
  sort: EpisodeSort.optional()
});

export const AtlasCatalogQueryDTO = PaginationQueryDTO.extend({
  q: z.string().trim().min(1).optional(),
  type: AtlasEntityType.optional(),
  section: AtlasSection.optional(),
  country: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  sort: AtlasCatalogSort.optional()
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
  country: AtlasEntityReferenceDTO.nullable(),
  affiliation: AtlasEntityReferenceDTO.nullable()
});

export const CharacterPreviewDTO = z.object({
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  name_native: z.string().nullable(),
  avatar_asset_path: z.string(),
  tagline: z.string().nullable(),
  country: AtlasEntityReferenceDTO.nullable(),
  affiliation: AtlasEntityReferenceDTO.nullable()
});

export const AtlasPreviewDTO = AtlasEntityReferenceDTO.extend({
  sections: z.array(AtlasSection),
  country: AtlasEntityReferenceDTO.nullable(),
  location: AtlasEntityReferenceDTO.nullable()
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

export const EpisodeParticipantDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string()
});

export const EpisodeListItemDTO = EpisodeDTO.omit({ content_markdown: true }).extend({
  country: AtlasEntityReferenceDTO
});

export const EpisodeCatalogItemDTO = EpisodeDTO.omit({ content_markdown: true }).extend({
  country: AtlasEntityReferenceDTO,
  participants: z.array(EpisodeParticipantDTO)
});

export const AtlasFactDTO = z.object({
  title: z.string(),
  text: z.string(),
  meta: z.string().nullable()
});

export const AtlasQuoteCharacterDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  name_ru: z.string(),
  avatar_asset_path: z.string()
});

export const AtlasQuoteDTO = z.object({
  id: z.number().int(),
  text: z.string(),
  sort_order: z.number().int(),
  speaker_type: AtlasQuoteSpeakerType,
  speaker_name: z.string(),
  speaker_meta: z.string().nullable(),
  character: AtlasQuoteCharacterDTO.nullable()
});

export const AtlasEntitySectionDTO = z.object({
  section: AtlasSection,
  title_ru: z.string(),
  summary: z.string().nullable(),
  body_markdown: z.string().nullable(),
  fact: AtlasFactDTO.nullable(),
  quotes: z.array(AtlasQuoteDTO)
});

export const AtlasEntityDTO = AtlasEntityReferenceDTO.extend({
  overview_markdown: z.string().nullable(),
  published_at: NullableIsoDateTime,
  country: AtlasEntityReferenceDTO.nullable(),
  location: AtlasEntityReferenceDTO.nullable()
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

export const AtlasCatalogItemDTO = AtlasEntityReferenceDTO.extend({
  sections: z.array(AtlasSection),
  country: AtlasEntityReferenceDTO.nullable(),
  location: AtlasEntityReferenceDTO.nullable(),
  related_count: z.number().int(),
  published_at: NullableIsoDateTime
});

export const AtlasCatalogTypeFacetDTO = z.object({
  value: AtlasEntityType,
  label: z.string(),
  count: z.number().int()
});

export const AtlasCatalogSectionFacetDTO = z.object({
  value: AtlasSection,
  label: z.string(),
  count: z.number().int()
});

export const AtlasCatalogPlaceFacetDTO = z.object({
  id: Uuid,
  slug: z.string(),
  title_ru: z.string(),
  count: z.number().int()
});

export const AtlasCatalogFacetsDTO = z.object({
  type: z.array(AtlasCatalogTypeFacetDTO),
  section: z.array(AtlasCatalogSectionFacetDTO),
  country: z.array(AtlasCatalogPlaceFacetDTO),
  location: z.array(AtlasCatalogPlaceFacetDTO)
});

export const AtlasResolvedRelationTargetDTO = z.object({
  type: EntityType,
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title: z.string(),
  avatar_asset_path: z.string().nullable(),
  country: AtlasEntityReferenceDTO.nullable()
});

export const AtlasResolvedRelationDTO = z.object({
  from_type: EntityType,
  from_id: Uuid,
  to_type: EntityType,
  to_id: Uuid,
  label: z.string().nullable(),
  target: AtlasResolvedRelationTargetDTO.nullable()
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
  country: AtlasEntityReferenceDTO,
  characters: z.array(EpisodeCharacterLinkDTO),
  locations: z.array(AtlasEntityReferenceDTO)
});

export const CharacterDetailResponseDTO = z.object({
  character: CharacterDTO,
  country: AtlasEntityReferenceDTO.nullable(),
  affiliation: AtlasEntityReferenceDTO.nullable(),
  quirks: z.array(CharacterQuirkDTO),
  rumors: z.array(CharacterRumorDTO),
  episodes: z.array(EpisodeListItemDTO)
});

export const AtlasDetailResponseDTO = z.object({
  entity: AtlasEntityDTO,
  sections: z.array(AtlasEntitySectionDTO),
  relations: z.array(AtlasResolvedRelationDTO)
});

export const SeriesDetailResponseDTO = z.object({
  series: EpisodeSeriesDTO,
  episodes: z.array(EpisodeListItemDTO)
});

export const HomeEpisodeSeriesDTO = z.object({
  id: Uuid,
  slug: z.string(),
  url: z.string(),
  title_ru: z.string(),
  brand_color: z.string().nullable()
});

export const HomeEpisodeParticipantDTO = EpisodeParticipantDTO;

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
  country: AtlasEntityReferenceDTO,
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

export const PaginatedEpisodesResponseDTO = PaginatedDTO(EpisodeCatalogItemDTO);
export const PaginatedSeriesResponseDTO = PaginatedDTO(EpisodeSeriesDTO);
export const PaginatedCharactersResponseDTO = PaginatedDTO(CharacterListItemDTO);
export const AtlasCatalogResponseDTO = z.object({
  items: z.array(AtlasCatalogItemDTO),
  facets: AtlasCatalogFacetsDTO,
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int()
});

export type EpisodeSeriesDTO = z.infer<typeof EpisodeSeriesDTO>;
export type EpisodeDTO = z.infer<typeof EpisodeDTO>;
export type CharacterDTO = z.infer<typeof CharacterDTO>;
export type AtlasEntityDTO = z.infer<typeof AtlasEntityDTO>;
export type AtlasEntityReferenceDTO = z.infer<typeof AtlasEntityReferenceDTO>;
export type AtlasEntitySectionDTO = z.infer<typeof AtlasEntitySectionDTO>;
export type CharacterReferenceDTO = z.infer<typeof CharacterReferenceDTO>;
export type CharacterListItemDTO = z.infer<typeof CharacterListItemDTO>;
export type CharacterPreviewDTO = z.infer<typeof CharacterPreviewDTO>;
export type AtlasPreviewDTO = z.infer<typeof AtlasPreviewDTO>;
export type PaginatedEpisodesResponseDTO = z.infer<typeof PaginatedEpisodesResponseDTO>;
export type PaginatedSeriesResponseDTO = z.infer<typeof PaginatedSeriesResponseDTO>;
export type SeriesDetailResponseDTO = z.infer<typeof SeriesDetailResponseDTO>;
export type PaginatedCharactersResponseDTO = z.infer<typeof PaginatedCharactersResponseDTO>;
export type AtlasCatalogResponseDTO = z.infer<typeof AtlasCatalogResponseDTO>;
export type AtlasCatalogItemDTO = z.infer<typeof AtlasCatalogItemDTO>;
export type EpisodeParticipantDTO = z.infer<typeof EpisodeParticipantDTO>;
export type EpisodeCharacterLinkDTO = z.infer<typeof EpisodeCharacterLinkDTO>;
export type EpisodeDetailResponseDTO = z.infer<typeof EpisodeDetailResponseDTO>;
export type SearchResultDTO = z.infer<typeof SearchResultDTO>;
export type SearchGroupDTO = z.infer<typeof SearchGroupDTO>;
export type SearchGroupsDTO = z.infer<typeof SearchGroupsDTO>;
export type HomeSnapshotDTO = z.infer<typeof HomeSnapshotDTO>;
export type HomeLatestEpisodeDTO = z.infer<typeof HomeLatestEpisodeDTO>;
export type HomeAboutProfileDTO = z.infer<typeof HomeAboutProfileDTO>;
export type HomeWorldQuoteDTO = z.infer<typeof HomeWorldQuoteDTO>;
export type HomeWorldQuoteResponseDTO = z.infer<typeof HomeWorldQuoteResponseDTO>;
export type CharacterSort = z.infer<typeof CharacterSort>;
export type EpisodeSort = z.infer<typeof EpisodeSort>;
export type AtlasCatalogSort = z.infer<typeof AtlasCatalogSort>;
export type AtlasQuoteSpeakerType = z.infer<typeof AtlasQuoteSpeakerType>;
export type EntityType = z.infer<typeof EntityType>;
export type AtlasEntityType = z.infer<typeof AtlasEntityType>;
export type AtlasSection = z.infer<typeof AtlasSection>;
export type AtlasResolvedRelationTargetDTO = z.infer<typeof AtlasResolvedRelationTargetDTO>;
export type AtlasResolvedRelationDTO = z.infer<typeof AtlasResolvedRelationDTO>;
export type AtlasFactDTO = z.infer<typeof AtlasFactDTO>;
export type AtlasQuoteCharacterDTO = z.infer<typeof AtlasQuoteCharacterDTO>;
export type AtlasQuoteDTO = z.infer<typeof AtlasQuoteDTO>;
export type AtlasDetailResponseDTO = z.infer<typeof AtlasDetailResponseDTO>;
export type CharacterDetailResponseDTO = z.infer<typeof CharacterDetailResponseDTO>;
export type CharacterFactPersonDTO = z.infer<typeof CharacterFactPersonDTO>;
export type CharacterFactOfDayDTO = z.infer<typeof CharacterFactOfDayDTO>;
export type CharacterFactOfDayResponseDTO = z.infer<typeof CharacterFactOfDayResponseDTO>;
