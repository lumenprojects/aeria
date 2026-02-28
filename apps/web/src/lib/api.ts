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

export function getEpisode(slug: string) {
  return fetchJson<any>(`/api/episodes/${slug}`);
}

export function getCharacters() {
  return fetchJson<{ items: any[] }>("/api/characters");
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
