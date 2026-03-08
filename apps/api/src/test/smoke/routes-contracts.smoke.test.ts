import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const endMock = vi.fn();

vi.mock("../../db.js", () => ({
  pool: {
    query: queryMock,
    end: endMock
  }
}));

describe("API route contracts smoke", () => {
  beforeEach(() => {
    queryMock.mockReset();
    endMock.mockReset();
    vi.resetModules();
  });

  it("returns 400 for invalid episodes list query", async () => {
    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/episodes?page=0"
    });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "Invalid query parameters" });
    await app.close();
  });

  it("returns paginated episodes payload with strict shape", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_id: "00000000-0000-0000-0000-000000000021",
            episode_number: 1,
            global_order: 1,
            title_native: null,
            title_ru: "Episode 001",
            summary: "Test episode",
            reading_minutes: 3,
            published_at: new Date("2026-03-04T00:00:00Z"),
            country_slug: "ru-example",
            country_title_ru: "Country 01",
            country_flag_colors: ["#111111", "#ffffff"]
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/episodes?page=1&limit=20"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          slug: "episode-001",
          series_id: "00000000-0000-0000-0000-000000000011",
          country_id: "00000000-0000-0000-0000-000000000021",
          episode_number: 1,
          global_order: 1,
          title_native: null,
          title_ru: "Episode 001",
          summary: "Test episode",
          reading_minutes: 3,
          published_at: "2026-03-04T00:00:00.000Z",
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          }
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    });

    await app.close();
  });

  it("returns 503 when search backend is not configured", async () => {
    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/search?q=test"
    });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: "Typesense is not configured" });
    await app.close();
  });

  it("returns 404 for unknown episode details", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/episodes/missing-episode"
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Episode not found" });
    await app.close();
  });

  it("returns episode details payload with strict shape", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_id: "00000000-0000-0000-0000-000000000021",
            episode_number: 1,
            global_order: 1,
            title_native: "Original",
            title_ru: "Episode 001",
            summary: "Test episode",
            content_markdown: "Body",
            reading_minutes: 3,
            published_at: new Date("2026-03-04T00:00:00Z")
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000011",
            slug: "series-01",
            title_ru: "Series 01",
            brand_color: "#ffaa44",
            summary: "Series summary"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            name_native: null,
            tagline: "Character tagline"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000041",
            slug: "location-001",
            title_ru: "Location 001",
            summary: "Location summary",
            country_id: "00000000-0000-0000-0000-000000000021"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/episodes/episode-001"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      episode: {
        id: "00000000-0000-0000-0000-000000000001",
        slug: "episode-001",
        series_id: "00000000-0000-0000-0000-000000000011",
        country_id: "00000000-0000-0000-0000-000000000021",
        episode_number: 1,
        global_order: 1,
        title_native: "Original",
        title_ru: "Episode 001",
        summary: "Test episode",
        content_markdown: "Body",
        reading_minutes: 3,
        published_at: "2026-03-04T00:00:00.000Z"
      },
      series: {
        id: "00000000-0000-0000-0000-000000000011",
        slug: "series-01",
        title_ru: "Series 01",
        brand_color: "#ffaa44",
        summary: "Series summary"
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ru-example",
        title_ru: "Country 01",
        flag_colors: ["#111111", "#ffffff"]
      },
      characters: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          name_ru: "Character 001",
          name_native: null,
          tagline: "Character tagline"
        }
      ],
      locations: [
        {
          id: "00000000-0000-0000-0000-000000000041",
          slug: "location-001",
          title_ru: "Location 001",
          summary: "Location summary",
          country_id: "00000000-0000-0000-0000-000000000021"
        }
      ]
    });
    await app.close();
  });

  it("returns character details payload with strict shape", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png",
            name_native: null,
            affiliation_id: "00000000-0000-0000-0000-000000000051",
            country_id: "00000000-0000-0000-0000-000000000021",
            tagline: "Character tagline",
            gender: "unknown",
            race: "human",
            height_cm: 170,
            age: 20,
            favorite_food: "tea",
            orientation: "unknown",
            mbti: "INTJ",
            bio_markdown: "Bio",
            published_at: new Date("2026-03-04T00:00:00Z")
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [{ text: "Quirk 1", sort_order: 1 }]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            text: "Rumor 1",
            author_name: "Witness",
            author_meta: "Cook",
            source_type: "atlas_entry",
            source_id: "00000000-0000-0000-0000-000000000051",
            sort_order: 1,
            source_character_slug: null,
            source_character_title: null,
            source_character_avatar_asset_path: null,
            source_atlas_slug: "atlas-001",
            source_atlas_title: "Atlas 001",
            source_atlas_avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_id: "00000000-0000-0000-0000-000000000021",
            episode_number: 1,
            global_order: 1,
            title_native: null,
            title_ru: "Episode 001",
            summary: "Test episode",
            reading_minutes: 3,
            published_at: new Date("2026-03-04T00:00:00Z"),
            country_slug: "ru-example",
            country_title_ru: "Country 01",
            country_flag_colors: ["#111111", "#ffffff"]
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            kind: "social",
            title_ru: "Atlas 001",
            avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/character-001"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      character: {
        id: "00000000-0000-0000-0000-000000000031",
        slug: "character-001",
        name_ru: "Character 001",
        avatar_asset_path: "/assets/images/characters/character-001.png",
        name_native: null,
        affiliation_id: "00000000-0000-0000-0000-000000000051",
        country_id: "00000000-0000-0000-0000-000000000021",
        tagline: "Character tagline",
        gender: "unknown",
        race: "human",
        height_cm: 170,
        age: 20,
        favorite_food: "tea",
        orientation: "unknown",
        mbti: "INTJ",
        bio_markdown: "Bio",
        published_at: "2026-03-04T00:00:00.000Z"
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ru-example",
        title_ru: "Country 01",
        flag_colors: ["#111111", "#ffffff"]
      },
      affiliation: {
        id: "00000000-0000-0000-0000-000000000051",
        slug: "atlas-001",
        kind: "social",
        title_ru: "Atlas 001",
        avatar_asset_path: "/assets/images/atlas/atlas-001.png"
      },
      quirks: [{ text: "Quirk 1", sort_order: 1 }],
      rumors: [
        {
          text: "Rumor 1",
          author_name: "Witness",
          author_meta: "Cook",
          source: {
            type: "atlas_entry",
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            title: "Atlas 001",
            avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          },
          sort_order: 1
        }
      ],
      episodes: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          slug: "episode-001",
          series_id: "00000000-0000-0000-0000-000000000011",
          country_id: "00000000-0000-0000-0000-000000000021",
          episode_number: 1,
          global_order: 1,
          title_native: null,
          title_ru: "Episode 001",
          summary: "Test episode",
          reading_minutes: 3,
          published_at: "2026-03-04T00:00:00.000Z",
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          }
        }
      ]
    });
    await app.close();
  });

  it("returns atlas details payload with strict shape", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            kind: "object",
            title_ru: "Atlas 001",
            summary: "Atlas summary",
            content_markdown: "Atlas content",
            avatar_asset_path: "/assets/images/atlas/atlas-001.png",
            country_id: "00000000-0000-0000-0000-000000000021",
            location_id: "00000000-0000-0000-0000-000000000041",
            published_at: new Date("2026-03-04T00:00:00Z")
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            from_type: "atlas_entry",
            from_id: "00000000-0000-0000-0000-000000000051",
            to_type: "episode",
            to_id: "00000000-0000-0000-0000-000000000001",
            label: "related"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/atlas/atlas-001"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      entry: {
        id: "00000000-0000-0000-0000-000000000051",
        slug: "atlas-001",
        kind: "object",
        title_ru: "Atlas 001",
        summary: "Atlas summary",
        content_markdown: "Atlas content",
        avatar_asset_path: "/assets/images/atlas/atlas-001.png",
        country_id: "00000000-0000-0000-0000-000000000021",
        location_id: "00000000-0000-0000-0000-000000000041",
        published_at: "2026-03-04T00:00:00.000Z"
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ru-example",
        title_ru: "Country 01",
        flag_colors: ["#111111", "#ffffff"]
      },
      links: [
        {
          from_type: "atlas_entry",
          from_id: "00000000-0000-0000-0000-000000000051",
          to_type: "episode",
          to_id: "00000000-0000-0000-0000-000000000001",
          label: "related"
        }
      ]
    });
    await app.close();
  });

  it("returns 404 for unknown character details", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/missing-character"
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Character not found" });
    await app.close();
  });

  it("returns 404 for unknown atlas details", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/atlas/missing-atlas"
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: "Atlas entry not found" });
    await app.close();
  });
});
