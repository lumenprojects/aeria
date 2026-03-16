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
      })
      .mockResolvedValueOnce({
        rows: [
          {
            episode_id: "00000000-0000-0000-0000-000000000001",
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png"
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
          url: "/episodes/episode-001",
          series_id: "00000000-0000-0000-0000-000000000011",
          country_id: "00000000-0000-0000-0000-000000000021",
          episode_number: 1,
          global_order: 1,
          title_native: null,
          title_ru: "Episode 001",
          summary: "Test episode",
          reading_minutes: 3,
          published_at: "2026-03-04T00:00:00.000Z",
          participants: [
            {
              id: "00000000-0000-0000-0000-000000000031",
              slug: "character-001",
              url: "/characters/character-001",
              name_ru: "Character 001",
              avatar_asset_path: "/assets/images/characters/character-001.png"
            }
          ],
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            url: "/atlas/ru-example",
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

  it("supports atlas list search, kind filter and sort with strict shape", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            kind: "geography",
            title_ru: "Atlas 001",
            summary: "Atlas summary",
            country_id: "00000000-0000-0000-0000-000000000021",
            location_id: "00000000-0000-0000-0000-000000000041"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/atlas?page=1&limit=100&q=atlas&kind=geography&sort=title_desc"
    });

    expect(res.statusCode).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual(["geography", "%atlas%"]);
    expect(String(queryMock.mock.calls[1][0])).toContain("ORDER BY title_ru DESC");
    expect(res.json()).toEqual({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000051",
          slug: "atlas-001",
          url: "/atlas/atlas-001",
          kind: "geography",
          title_ru: "Atlas 001",
          summary: "Atlas summary",
          country_id: "00000000-0000-0000-0000-000000000021",
          location_id: "00000000-0000-0000-0000-000000000041"
        }
      ],
      total: 1,
      page: 1,
      limit: 100
    });

    await app.close();
  });

  it("supports episodes list character filter and newest sort", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000002",
            slug: "episode-002",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_id: "00000000-0000-0000-0000-000000000021",
            episode_number: 2,
            global_order: 2,
            title_native: null,
            title_ru: "Episode 002",
            summary: "Filtered episode",
            reading_minutes: 5,
            published_at: new Date("2026-03-05T00:00:00Z"),
            country_slug: "ru-example",
            country_title_ru: "Country 01",
            country_flag_colors: ["#111111", "#ffffff"]
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            episode_id: "00000000-0000-0000-0000-000000000002",
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/episodes?page=1&limit=100&series=series-01&character=character-001&sort=newest"
    });

    expect(res.statusCode).toBe(200);
    expect(String(queryMock.mock.calls[0][0])).toContain("JOIN episode_characters ec_filter");
    expect(String(queryMock.mock.calls[1][0])).toContain("ORDER BY e.global_order DESC");
    expect(queryMock.mock.calls[0][1]).toEqual(["series-01", "character-001"]);

    await app.close();
  });

  it("filters hidden characters from the public characters list", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            name_native: null,
            tagline: "Character tagline",
            avatar_asset_path: "/assets/images/characters/character-001.png",
            country_id: "00000000-0000-0000-0000-000000000021",
            country_slug: "ru-example",
            country_title_ru: "Country 01",
            country_flag_colors: ["#111111", "#ffffff"],
            affiliation_id: "00000000-0000-0000-0000-000000000051",
            affiliation_slug: "atlas-001",
            affiliation_kind: "social",
            affiliation_title_ru: "Atlas 001",
            affiliation_avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters?page=1&limit=20"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Character 001",
          name_native: null,
          tagline: "Character tagline",
          avatar_asset_path: "/assets/images/characters/character-001.png",
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            url: "/atlas/ru-example",
            title_ru: "Country 01",
            flag_colors: ["#111111", "#ffffff"]
          },
          affiliation: {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            url: "/atlas/atlas-001",
            kind: "social",
            title_ru: "Atlas 001",
            avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          }
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    });
    expect(String(queryMock.mock.calls[0][0])).toContain("listed = TRUE");
    expect(String(queryMock.mock.calls[1][0])).toContain("listed = TRUE");

    await app.close();
  });

  it("supports character list query filters, search and sort", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            name_native: null,
            tagline: "Character tagline",
            avatar_asset_path: "/assets/images/characters/character-001.png",
            country_id: "00000000-0000-0000-0000-000000000021",
            country_slug: "ru-example",
            country_title_ru: "Country 01",
            country_flag_colors: ["#111111", "#ffffff"],
            affiliation_id: "00000000-0000-0000-0000-000000000051",
            affiliation_slug: "atlas-001",
            affiliation_kind: "social",
            affiliation_title_ru: "Atlas 001",
            affiliation_avatar_asset_path: "/assets/images/atlas/atlas-001.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters?page=1&limit=100&q=tea&country=ru-example&affiliation=atlas-001&sort=name_desc"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().items).toHaveLength(1);
    expect(String(queryMock.mock.calls[0][0])).toContain("COALESCE(ch.favorite_food, '') ILIKE");
    expect(String(queryMock.mock.calls[0][0])).toContain("c.slug =");
    expect(String(queryMock.mock.calls[0][0])).toContain("a.slug =");
    expect(String(queryMock.mock.calls[1][0])).toContain("ORDER BY ch.name_ru DESC");
    expect(queryMock.mock.calls[0][1]).toEqual(["%tea%", "ru-example", "atlas-001"]);
    expect(queryMock.mock.calls[1][1]).toEqual(["%tea%", "ru-example", "atlas-001", 100, 0]);

    await app.close();
  });

  it("returns character fact of day payload with comment author", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 2 }] })
      .mockResolvedValueOnce({ rows: [{ day_key: "20000" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 11,
            fact_text: "Лилетт однажды попыталась приготовить настоящий шоколатин.",
            comment_text: "Я до сих пор не понимаю, почему она добавила туда ром.",
            subject_id: "00000000-0000-0000-0000-000000000031",
            subject_slug: "character-001",
            subject_name_ru: "Лилетт",
            subject_avatar_asset_path: "/assets/images/characters/character-001.png",
            author_id: "00000000-0000-0000-0000-000000000032",
            author_slug: "character-002",
            author_name_ru: "Арно",
            author_avatar_asset_path: "/assets/images/characters/character-002.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/fact-of-day"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      fact_of_day: {
        id: 11,
        fact_text: "Лилетт однажды попыталась приготовить настоящий шоколатин.",
        comment_text: "Я до сих пор не понимаю, почему она добавила туда ром.",
        subject_character: {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          avatar_asset_path: "/assets/images/characters/character-001.png"
        },
        comment_author_character: {
          id: "00000000-0000-0000-0000-000000000032",
          slug: "character-002",
          url: "/characters/character-002",
          name_ru: "Арно",
          avatar_asset_path: "/assets/images/characters/character-002.png"
        }
      }
    });

    await app.close();
  });

  it("returns character fact of day payload with null comment author", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({ rows: [{ day_key: "20000" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 12,
            fact_text: "Лилетт прячет лаванду во всех блокнотах.",
            comment_text: "Это была не моя идея.",
            subject_id: "00000000-0000-0000-0000-000000000031",
            subject_slug: "character-001",
            subject_name_ru: "Лилетт",
            subject_avatar_asset_path: "/assets/images/characters/character-001.png",
            author_id: null,
            author_slug: null,
            author_name_ru: null,
            author_avatar_asset_path: null
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/fact-of-day"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      fact_of_day: {
        id: 12,
        fact_text: "Лилетт прячет лаванду во всех блокнотах.",
        comment_text: "Это была не моя идея.",
        subject_character: {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          avatar_asset_path: "/assets/images/characters/character-001.png"
        },
        comment_author_character: null
      }
    });

    await app.close();
  });

  it("returns compact character preview payload", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "forsil-villet",
            name_ru: "Форсиль Виллет",
            avatar_asset_path: "/assets/images/characters/forsil-villet.png",
            name_native: "Forsil Villet",
            affiliation_id: "00000000-0000-0000-0000-000000000051",
            country_id: "00000000-0000-0000-0000-000000000021",
            tagline: "Дом держится на её ритме."
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ausonia",
            title_ru: "Авзония",
            flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "domaine-des-immortelles",
            kind: "geography",
            title_ru: "Бастида де ла Люн д'Ор",
            avatar_asset_path: "/assets/images/atlas/domaine-des-immortelles.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/forsil-villet/preview"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      slug: "forsil-villet",
      url: "/characters/forsil-villet",
      name_ru: "Форсиль Виллет",
      name_native: "Forsil Villet",
      avatar_asset_path: "/assets/images/characters/forsil-villet.png",
      tagline: "Дом держится на её ритме.",
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
      },
      affiliation: {
        id: "00000000-0000-0000-0000-000000000051",
        slug: "domaine-des-immortelles",
        url: "/atlas/domaine-des-immortelles",
        kind: "geography",
        title_ru: "Бастида де ла Люн д'Ор",
        avatar_asset_path: "/assets/images/atlas/domaine-des-immortelles.png"
      }
    });

    await app.close();
  });

  it("returns atlas preview payload for country fallback slugs", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ausonia",
            title_ru: "Авзония",
            flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/atlas/ausonia/preview"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      slug: "ausonia",
      url: "/atlas/ausonia",
      kind: "geography",
      title_ru: "Авзония",
      summary: null,
      avatar_asset_path: null,
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
      }
    });

    await app.close();
  });

  it("returns atlas preview payload for location fallback slugs", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000061",
            slug: "biblioteka-lorlayt",
            title_ru: "Библиотека Лорлайт",
            summary: "Главная библиотека Эверсоула.",
            avatar_asset_path: "/assets/images/locations/biblioteka-lorlayt.png",
            country_id: "00000000-0000-0000-0000-000000000021"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "lumendor",
            title_ru: "Люмендор",
            flag_colors: ["#C1272D", "#111111", "#FFFFFF"]
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/atlas/biblioteka-lorlayt/preview"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      slug: "biblioteka-lorlayt",
      url: "/atlas/biblioteka-lorlayt",
      kind: "geography",
      title_ru: "Библиотека Лорлайт",
      summary: "Главная библиотека Эверсоула.",
      avatar_asset_path: "/assets/images/locations/biblioteka-lorlayt.png",
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "lumendor",
        url: "/atlas/lumendor",
        title_ru: "Люмендор",
        flag_colors: ["#C1272D", "#111111", "#FFFFFF"]
      }
    });

    await app.close();
  });

  it("returns null fact of day when no visible facts exist", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/fact-of-day"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ fact_of_day: null });
    await app.close();
  });

  it("resolves /api/characters/fact-of-day via fact route and not via slug route", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/fact-of-day"
    });

    expect(res.statusCode).toBe(200);
    expect(String(queryMock.mock.calls[0][0])).toContain("FROM character_facts");

    await app.close();
  });

  it("uses Moscow day key to compute deterministic daily offset", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ day_key: "8" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 13,
            fact_text: "Факт с offset 2.",
            comment_text: "Комментарий без автора.",
            subject_id: "00000000-0000-0000-0000-000000000031",
            subject_slug: "character-001",
            subject_name_ru: "Лилетт",
            subject_avatar_asset_path: "/assets/images/characters/character-001.png",
            author_id: null,
            author_slug: null,
            author_name_ru: null,
            author_avatar_asset_path: null
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/characters/fact-of-day"
    });

    expect(res.statusCode).toBe(200);
    expect(queryMock.mock.calls[2][1]).toEqual([2]);
    expect(res.json()).toEqual({
      fact_of_day: {
        id: 13,
        fact_text: "Факт с offset 2.",
        comment_text: "Комментарий без автора.",
        subject_character: {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          avatar_asset_path: "/assets/images/characters/character-001.png"
        },
        comment_author_character: null
      }
    });

    await app.close();
  });

  it("returns home snapshot with latest episode", async () => {
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
            title_native: "Au-dela des vignes",
            title_ru: "За пределами виноградников",
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
            id: "00000000-0000-0000-0000-000000000099",
            slug: "ame",
            name_ru: "Ame",
            avatar_asset_path: "/assets/images/characters/ame.png",
            home_intro_title: "Привет, я Амэ",
            home_intro_markdown: "Aeria intro"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            quote: "У нас не было героев. Только сосед, который умел дышать через уши.",
            source: "Услышано у костра"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000011",
            slug: "series-01",
            title_ru: "Жёлтая луна",
            brand_color: "#ffaa44"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png"
          },
          {
            id: "00000000-0000-0000-0000-000000000032",
            slug: "character-002",
            name_ru: "Character 002",
            avatar_asset_path: "/assets/images/characters/character-002.png"
          }
        ]
      });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/home"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      latest_episode: {
        id: "00000000-0000-0000-0000-000000000001",
        slug: "episode-001",
        url: "/episodes/episode-001",
        episode_number: 1,
        global_order: 1,
        title_native: "Au-dela des vignes",
        title_ru: "За пределами виноградников",
        summary: "Test episode",
        reading_minutes: 3,
        published_at: "2026-03-04T00:00:00.000Z",
        country: {
          id: "00000000-0000-0000-0000-000000000021",
          slug: "ru-example",
          url: "/atlas/ru-example",
          title_ru: "Country 01",
          flag_colors: ["#111111", "#ffffff"]
        },
        series: {
          id: "00000000-0000-0000-0000-000000000011",
          slug: "series-01",
          url: "/episodes?series=series-01",
          title_ru: "Жёлтая луна",
          brand_color: "#ffaa44"
        },
        participants: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            url: "/characters/character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png"
          },
          {
            id: "00000000-0000-0000-0000-000000000032",
            slug: "character-002",
            url: "/characters/character-002",
            name_ru: "Character 002",
            avatar_asset_path: "/assets/images/characters/character-002.png"
          }
        ]
      },
      about_profile: {
        id: "00000000-0000-0000-0000-000000000099",
        slug: "ame",
        url: "/characters/ame",
        name_ru: "Ame",
        avatar_asset_path: "/assets/images/characters/ame.png",
        home_intro_title: "Привет, я Амэ",
        home_intro_markdown: "Aeria intro"
      },
      world_quote: {
        id: 7,
        quote: "У нас не было героев. Только сосед, который умел дышать через уши.",
        source: "Услышано у костра"
      }
    });

    await app.close();
  });

  it("returns random world quote payload with strict shape", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 13,
          quote: "Карта всегда врет о расстояниях, но редко врет о страхе.",
          source: "Услышано на переправе"
        }
      ]
    });

    const { buildApp } = await import("../../app.js");
    const app = await buildApp();

    const res = await app.inject({
      method: "GET",
      url: "/api/home/world-quote/random?exclude_id=7"
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      world_quote: {
        id: 13,
        quote: "Карта всегда врет о расстояниях, но редко врет о страхе.",
        source: "Услышано на переправе"
      }
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
              tagline: "Character tagline",
              avatar_asset_path: "/assets/images/characters/character-001.png"
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
        url: "/episodes/episode-001",
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
        url: "/episodes?series=series-01",
        title_ru: "Series 01",
        brand_color: "#ffaa44",
        summary: "Series summary"
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ru-example",
        url: "/atlas/ru-example",
        title_ru: "Country 01",
        flag_colors: ["#111111", "#ffffff"]
      },
        characters: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            url: "/characters/character-001",
            name_ru: "Character 001",
            name_native: null,
            tagline: "Character tagline",
            avatar_asset_path: "/assets/images/characters/character-001.png"
          }
        ],
      locations: [
        {
          id: "00000000-0000-0000-0000-000000000041",
          slug: "location-001",
          url: "/atlas/location-001",
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
        url: "/characters/character-001",
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
        url: "/atlas/ru-example",
        title_ru: "Country 01",
        flag_colors: ["#111111", "#ffffff"]
      },
      affiliation: {
        id: "00000000-0000-0000-0000-000000000051",
        slug: "atlas-001",
        url: "/atlas/atlas-001",
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
            url: "/atlas/atlas-001",
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
          url: "/episodes/episode-001",
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
            url: "/atlas/ru-example",
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
        url: "/atlas/atlas-001",
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
        url: "/atlas/ru-example",
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
