import type {
  AtlasCatalogResponseDTO,
  AtlasCatalogSort,
  AtlasDetailResponseDTO,
  AtlasPreviewDTO,
  CharacterDetailResponseDTO,
  CharacterFactOfDayResponseDTO,
  CharacterPreviewDTO,
  EpisodeDetailResponseDTO,
  EpisodeSort,
  CharacterSort,
  HomeSnapshotDTO,
  HomeWorldQuoteResponseDTO,
  PaginatedCharactersResponseDTO,
  PaginatedEpisodesResponseDTO,
  PaginatedSeriesResponseDTO,
  SearchGroupsDTO,
  SeriesDetailResponseDTO
} from "@aeria/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

type GetEpisodesParams = {
  page?: number;
  limit?: number;
  series?: string;
  country?: string;
  character?: string;
  sort?: EpisodeSort;
};

export function getEpisodes(params?: GetEpisodesParams) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.series) query.set("series", params.series);
  if (params?.country) query.set("country", params.country);
  if (params?.character) query.set("character", params.character);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return fetchJson<PaginatedEpisodesResponseDTO>(`/api/episodes${qs ? `?${qs}` : ""}`);
}

export function getHomeSnapshot() {
  return fetchJson<HomeSnapshotDTO>("/api/home");
}

export async function getRandomHomeWorldQuote(excludeId?: number) {
  const query = new URLSearchParams();
  if (excludeId !== undefined) {
    query.set("exclude_id", String(excludeId));
  }

  const qs = query.toString();
  const payload = await fetchJson<HomeWorldQuoteResponseDTO>(`/api/home/world-quote/random${qs ? `?${qs}` : ""}`);
  return payload.world_quote;
}

export function getEpisode(slug: string) {
  return fetchJson<EpisodeDetailResponseDTO>(`/api/episodes/${slug}`);
}

export function getSeries(slug: string) {
  return fetchJson<SeriesDetailResponseDTO>(`/api/series/${slug}`);
}

export function getSeriesList(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return fetchJson<PaginatedSeriesResponseDTO>(`/api/series${qs ? `?${qs}` : ""}`);
}

type GetCharactersParams = {
  page?: number;
  limit?: number;
  q?: string;
  country?: string;
  affiliation?: string;
  sort?: CharacterSort;
};

export function getCharacters(params?: GetCharactersParams) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);
  if (params?.country) query.set("country", params.country);
  if (params?.affiliation) query.set("affiliation", params.affiliation);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return fetchJson<PaginatedCharactersResponseDTO>(`/api/characters${qs ? `?${qs}` : ""}`);
}

export async function getCharacterFactOfDay() {
  const payload = await fetchJson<CharacterFactOfDayResponseDTO>("/api/characters/fact-of-day");
  return payload.fact_of_day;
}

export function getCharacter(slug: string) {
  return fetchJson<CharacterDetailResponseDTO>(`/api/characters/${slug}`);
}

export function getCharacterPreview(slug: string) {
  return fetchJson<CharacterPreviewDTO>(`/api/characters/${slug}/preview`);
}

export function getAtlasCatalog(params?: {
  page?: number;
  limit?: number;
  q?: string;
  entity?: string;
  kind?: string;
  country?: string;
  anchor?: string;
  sort?: AtlasCatalogSort;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.q) query.set("q", params.q);
  if (params?.entity) query.set("entity", params.entity);
  if (params?.kind) query.set("kind", params.kind);
  if (params?.country) query.set("country", params.country);
  if (params?.anchor) query.set("anchor", params.anchor);
  if (params?.sort) query.set("sort", params.sort);
  const qs = query.toString();
  return fetchJson<AtlasCatalogResponseDTO>(`/api/atlas/catalog${qs ? `?${qs}` : ""}`);
}

export function getAtlasEntry(slug: string) {
  return fetchJson<AtlasDetailResponseDTO>(`/api/atlas/${slug}`);
}

export function getAtlasPreview(slug: string) {
  return fetchJson<AtlasPreviewDTO>(`/api/atlas/${slug}/preview`);
}

export function searchAll(query: string) {
  return fetchJson<SearchGroupsDTO>(`/api/search?q=${encodeURIComponent(query)}`);
}
