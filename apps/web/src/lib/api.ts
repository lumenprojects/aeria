import type {
  CharacterFactOfDayResponseDTO,
  CharacterSort,
  HomeSnapshotDTO,
  HomeWorldQuoteResponseDTO,
  PaginatedCharactersResponseDTO
} from "@aeria/shared";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function getEpisodes(params?: { series?: string; country?: string }) {
  const query = new URLSearchParams();
  if (params?.series) query.set("series", params.series);
  if (params?.country) query.set("country", params.country);
  const qs = query.toString();
  return fetchJson<{ items: any[] }>(`/api/episodes${qs ? `?${qs}` : ""}`);
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
  return fetchJson<any>(`/api/episodes/${slug}`);
}

export function getSeries(slug: string) {
  return fetchJson<any>(`/api/series/${slug}`);
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
  return fetchJson<any>(`/api/characters/${slug}`);
}

export function getAtlas(params?: { kind?: string }) {
  const query = new URLSearchParams();
  if (params?.kind) query.set("kind", params.kind);
  const qs = query.toString();
  return fetchJson<{ items: any[] }>(`/api/atlas${qs ? `?${qs}` : ""}`);
}

export function getAtlasEntry(slug: string) {
  return fetchJson<any>(`/api/atlas/${slug}`);
}

export function searchAll(query: string) {
  return fetchJson<{ groups: Array<{ type: string; hits: any[] }> }>(`/api/search?q=${encodeURIComponent(query)}`);
}
