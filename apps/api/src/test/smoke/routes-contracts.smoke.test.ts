import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const endMock = vi.fn();

vi.mock("../../db.js", () => ({
  pool: {
    query: queryMock,
    end: endMock
  }
}));

const countryRef = {
  id: "00000000-0000-0000-0000-000000000021",
  slug: "ausonia",
  url: "/atlas/ausonia",
  type: "country" as const,
  title_ru: "Авзония",
  summary: "Виноградные долины и строгие дома.",
  avatar_asset_path: null,
  flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
};

const worldRef = {
  id: "00000000-0000-0000-0000-000000000051",
  slug: "biblioteka-lorlayt",
  url: "/atlas/biblioteka-lorlayt",
  type: "organization" as const,
  title_ru: "Библиотека Лорлайт",
  summary: "Дом архивов и дисциплины.",
  avatar_asset_path: "/assets/images/atlas/biblioteka-lorlayt.png",
  flag_colors: null
};

const locationRef = {
  id: "00000000-0000-0000-0000-000000000041",
  slug: "domaine-des-immortelles",
  url: "/atlas/domaine-des-immortelles",
  type: "location" as const,
  title_ru: "Domaine des Immortelles",
  summary: "Поместье, где Арно начинает новую жизнь.",
  avatar_asset_path: "/assets/images/atlas/domaine-des-immortelles.png",
  flag_colors: null
};

async function createApp() {
  const { buildApp } = await import("../../app.js");
  return buildApp();
}

describe("API route contracts smoke", () => {
  beforeEach(() => {
    queryMock.mockReset();
    endMock.mockReset();
    vi.resetModules();
  });

  it("returns 400 for invalid episodes list query", async () => {
    const app = await createApp();
    const res = await app.inject({ method: "GET", url: "/api/episodes?page=0" });

    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: "Invalid query parameters" });
    await app.close();
  });

  it("returns paginated episodes payload with atlas country references", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ count: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_entity_id: countryRef.id,
            episode_number: 1,
            global_order: 1,
            title_native: null,
            title_ru: "Episode 001",
            summary: "Test episode",
            reading_minutes: 3,
            published_at: new Date("2026-03-04T00:00:00Z"),
            country_id: countryRef.id,
            country_slug: countryRef.slug,
            country_type: countryRef.type,
            country_title_ru: countryRef.title_ru,
            country_summary: countryRef.summary,
            country_avatar_asset_path: countryRef.avatar_asset_path,
            country_flag_colors: countryRef.flag_colors
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

    const app = await createApp();
    const res = await app.inject({ method: "GET", url: "/api/episodes?page=1&limit=20" });
    const payload = res.json();

    expect(res.statusCode).toBe(200);
    expect(payload.items[0]).toMatchObject({
      slug: "episode-001",
      country_entity_id: countryRef.id,
      country: countryRef
    });
    expect(payload.items[0].participants).toHaveLength(1);
    expect(payload.total).toBe(1);
    await app.close();
  });

  it("returns character list and detail payloads built on atlas entities", async () => {
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
            country_id: countryRef.id,
            country_slug: countryRef.slug,
            country_type: countryRef.type,
            country_title_ru: countryRef.title_ru,
            country_summary: countryRef.summary,
            country_avatar_asset_path: countryRef.avatar_asset_path,
            country_flag_colors: countryRef.flag_colors,
            affiliation_id: worldRef.id,
            affiliation_slug: worldRef.slug,
            affiliation_type: worldRef.type,
            affiliation_title_ru: worldRef.title_ru,
            affiliation_summary: worldRef.summary,
            affiliation_avatar_asset_path: worldRef.avatar_asset_path,
            affiliation_flag_colors: worldRef.flag_colors
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "character-001",
            name_ru: "Character 001",
            avatar_asset_path: "/assets/images/characters/character-001.png",
            name_native: null,
            affiliation_entity_id: worldRef.id,
            country_entity_id: countryRef.id,
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
      .mockResolvedValueOnce({ rows: [{ text: "Quirk 1", sort_order: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            text: "Rumor 1",
            author_name: "Witness",
            author_meta: "Cook",
            source_type: "atlas_entity",
            source_id: worldRef.id,
            sort_order: 1,
            source_character_slug: null,
            source_character_title: null,
            source_character_avatar_asset_path: null,
            source_atlas_slug: worldRef.slug,
            source_atlas_title: worldRef.title_ru,
            source_atlas_avatar_asset_path: worldRef.avatar_asset_path
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: countryRef.id,
            slug: countryRef.slug,
            type: countryRef.type,
            title_ru: countryRef.title_ru,
            summary: countryRef.summary,
            avatar_asset_path: countryRef.avatar_asset_path,
            flag_colors: countryRef.flag_colors
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: worldRef.id,
            slug: worldRef.slug,
            type: worldRef.type,
            title_ru: worldRef.title_ru,
            summary: worldRef.summary,
            avatar_asset_path: worldRef.avatar_asset_path,
            flag_colors: worldRef.flag_colors
          }
        ]
      });

    const app = await createApp();
    const listRes = await app.inject({ method: "GET", url: "/api/characters?page=1&limit=20" });
    const detailRes = await app.inject({ method: "GET", url: "/api/characters/character-001" });

    expect(listRes.statusCode).toBe(200);
    expect(String(queryMock.mock.calls[0][0])).toContain("listed = TRUE");
    expect(listRes.json().items[0]).toMatchObject({
      slug: "character-001",
      country: countryRef,
      affiliation: worldRef
    });

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.json()).toMatchObject({
      character: {
        slug: "character-001",
        affiliation_entity_id: worldRef.id,
        country_entity_id: countryRef.id
      },
      country: countryRef,
      affiliation: worldRef
    });
    expect(detailRes.json().rumors[0].source).toMatchObject({
      type: "atlas_entity",
      slug: worldRef.slug,
      url: worldRef.url
    });
    await app.close();
  });

  it("returns home snapshot and search fallback with modern entity groups", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_entity_id: countryRef.id,
            episode_number: 1,
            global_order: 1,
            title_native: "Original",
            title_ru: "Episode 001",
            summary: "Test episode",
            reading_minutes: 3,
            published_at: new Date("2026-03-04T00:00:00Z"),
            country_id: countryRef.id,
            country_slug: countryRef.slug,
            country_type: countryRef.type,
            country_title_ru: countryRef.title_ru,
            country_summary: countryRef.summary,
            country_avatar_asset_path: countryRef.avatar_asset_path,
            country_flag_colors: countryRef.flag_colors
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000031",
            slug: "forsil-villet",
            name_ru: "Форсиль Виллет",
            avatar_asset_path: "/assets/images/characters/forsil-villet.png",
            home_intro_title: "Дом держится на её ритме.",
            home_intro_markdown: "Форсиль удерживает режим дома даже в дни, когда все остальные уже сбились."
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ id: 7, quote: "Дом помнит шаги.", source: "Запись в старом регистре" }] })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000011", slug: "yellow-moon", title_ru: "Жёлтая Луна", brand_color: "#ffaa44" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000032", slug: "arnaud-dumont", name_ru: "Арно Дюмонт", avatar_asset_path: "/assets/images/characters/arnaud-dumont.png" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000001", slug: "episode-001", title: "Episode 001", summary: "Episode summary" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000031", slug: "character-001", title: "Character 001", summary: "Character tagline" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: worldRef.id, slug: worldRef.slug, title: worldRef.title_ru, summary: worldRef.summary }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000011", slug: "yellow-moon", title: "Жёлтая Луна", summary: "Series summary" }]
      });

    const app = await createApp();
    const homeRes = await app.inject({ method: "GET", url: "/api/home" });
    const searchRes = await app.inject({ method: "GET", url: "/api/search?q=test" });

    expect(homeRes.statusCode).toBe(200);
    expect(homeRes.json()).toMatchObject({
      latest_episode: { slug: "episode-001", country: countryRef },
      about_profile: { slug: "forsil-villet" },
      world_quote: { id: 7 }
    });

    expect(searchRes.statusCode).toBe(200);
    expect(searchRes.json().groups.map((group: { type: string }) => group.type)).toEqual([
      "episode",
      "character",
      "atlas_entity",
      "episode_series"
    ]);
    expect(searchRes.json().groups[2].hits[0]).toMatchObject({
      slug: worldRef.slug,
      type: "atlas_entity",
      url: worldRef.url
    });
    await app.close();
  });

  it("returns episode detail payload with atlas entity locations", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            slug: "episode-001",
            series_id: "00000000-0000-0000-0000-000000000011",
            country_entity_id: countryRef.id,
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
        rows: [{ id: "00000000-0000-0000-0000-000000000011", slug: "yellow-moon", title_ru: "Жёлтая Луна", brand_color: "#ffaa44", summary: "Series summary" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: countryRef.id, slug: countryRef.slug, type: countryRef.type, title_ru: countryRef.title_ru, summary: countryRef.summary, avatar_asset_path: countryRef.avatar_asset_path, flag_colors: countryRef.flag_colors }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000031", slug: "character-001", name_ru: "Character 001", name_native: null, tagline: "Character tagline", avatar_asset_path: "/assets/images/characters/character-001.png" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: locationRef.id, slug: locationRef.slug, type: locationRef.type, title_ru: locationRef.title_ru, summary: locationRef.summary, avatar_asset_path: locationRef.avatar_asset_path, flag_colors: locationRef.flag_colors }]
      });

    const app = await createApp();
    const res = await app.inject({ method: "GET", url: "/api/episodes/episode-001" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      episode: { slug: "episode-001", country_entity_id: countryRef.id },
      country: countryRef
    });
    expect(res.json().locations).toEqual([locationRef]);
    await app.close();
  });

  it("returns atlas catalog, preview and detail from canonical atlas entities", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: worldRef.id,
            slug: worldRef.slug,
            type: worldRef.type,
            title_ru: worldRef.title_ru,
            summary: worldRef.summary,
            overview_markdown: "Текст для каталога.",
            avatar_asset_path: worldRef.avatar_asset_path,
            flag_colors: worldRef.flag_colors,
            country_entity_id: countryRef.id,
            location_entity_id: locationRef.id,
            published_at: new Date("2026-03-14T00:00:00Z"),
            country_id: countryRef.id,
            country_slug: countryRef.slug,
            country_type: countryRef.type,
            country_title_ru: countryRef.title_ru,
            country_summary: countryRef.summary,
            country_avatar_asset_path: countryRef.avatar_asset_path,
            country_flag_colors: countryRef.flag_colors,
            location_id: locationRef.id,
            location_slug: locationRef.slug,
            location_type: locationRef.type,
            location_title_ru: locationRef.title_ru,
            location_summary: locationRef.summary,
            location_avatar_asset_path: locationRef.avatar_asset_path,
            location_flag_colors: locationRef.flag_colors,
            sections: ["social"],
            related_count: "1"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: worldRef.id,
            slug: worldRef.slug,
            type: worldRef.type,
            title_ru: worldRef.title_ru,
            summary: worldRef.summary,
            overview_markdown: "Overview",
            avatar_asset_path: worldRef.avatar_asset_path,
            flag_colors: worldRef.flag_colors,
            country_entity_id: countryRef.id,
            location_entity_id: locationRef.id,
            published_at: new Date("2026-03-14T00:00:00Z")
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ id: countryRef.id, slug: countryRef.slug, type: countryRef.type, title_ru: countryRef.title_ru, summary: countryRef.summary, avatar_asset_path: countryRef.avatar_asset_path, flag_colors: countryRef.flag_colors }] })
      .mockResolvedValueOnce({ rows: [{ id: locationRef.id, slug: locationRef.slug, type: locationRef.type, title_ru: locationRef.title_ru, summary: locationRef.summary, avatar_asset_path: locationRef.avatar_asset_path, flag_colors: locationRef.flag_colors }] })
      .mockResolvedValueOnce({ rows: [{ section: "social" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: worldRef.id,
            slug: worldRef.slug,
            type: worldRef.type,
            title_ru: worldRef.title_ru,
            summary: worldRef.summary,
            overview_markdown: "Основной текст записи.",
            avatar_asset_path: worldRef.avatar_asset_path,
            flag_colors: worldRef.flag_colors,
            country_entity_id: countryRef.id,
            location_entity_id: null,
            published_at: new Date("2026-03-14T00:00:00Z")
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ id: countryRef.id, slug: countryRef.slug, type: countryRef.type, title_ru: countryRef.title_ru, summary: countryRef.summary, avatar_asset_path: countryRef.avatar_asset_path, flag_colors: countryRef.flag_colors }] })
      .mockResolvedValueOnce({
        rows: [
          {
            section: "social",
            title_ru: "Социальное",
            summary: "Как место устроено внутри.",
            body_markdown: "Секция про ритм и порядок.",
            fact_title: "Тихий регистр",
            fact_text: "Даже шёпот здесь считается частью режима.",
            fact_meta: "Старое правило"
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "2",
            section: "social",
            speaker_type: "world",
            character_id: null,
            speaker_name: "Архивариус северного крыла",
            speaker_meta: "дежурство у каталога",
            text: "У этой записи нет права лежать молча.",
            sort_order: 0
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [{ to_type: "episode_series", to_id: "00000000-0000-0000-0000-000000000011", label: "Жёлтая Луна" }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: "00000000-0000-0000-0000-000000000011", slug: "yellow-moon", title_ru: "Жёлтая Луна" }]
      });

    const app = await createApp();
    const catalogRes = await app.inject({ method: "GET", url: `/api/atlas/catalog?page=1&limit=20&type=organization&section=social&country=ausonia&location=${locationRef.slug}` });
    const previewRes = await app.inject({ method: "GET", url: `/api/atlas/${worldRef.slug}/preview` });
    const detailRes = await app.inject({ method: "GET", url: `/api/atlas/${worldRef.slug}` });

    expect(catalogRes.statusCode).toBe(200);
    expect(catalogRes.json().items[0]).toMatchObject({
      slug: worldRef.slug,
      type: worldRef.type,
      country: countryRef,
      location: locationRef
    });

    expect(previewRes.statusCode).toBe(200);
    expect(previewRes.json()).toMatchObject({
      slug: worldRef.slug,
      type: worldRef.type,
      sections: ["social"],
      country: countryRef,
      location: locationRef
    });

    expect(detailRes.statusCode).toBe(200);
    expect(detailRes.json()).toMatchObject({
      entity: {
        slug: worldRef.slug,
        type: worldRef.type,
        country: countryRef
      }
    });
    expect(detailRes.json().relations[0]).toMatchObject({
      from_type: "atlas_entity",
      to_type: "episode_series"
    });
    expect(detailRes.json().sections[0]).toMatchObject({
      section: "social",
      fact: { title: "Тихий регистр" }
    });
    await app.close();
  });

  it("removes legacy /api/countries and /api/locations endpoints", async () => {
    const app = await createApp();
    const countryRes = await app.inject({ method: "GET", url: "/api/countries" });
    const locationRes = await app.inject({ method: "GET", url: "/api/locations" });

    expect(countryRes.statusCode).toBe(404);
    expect(locationRes.statusCode).toBe(404);
    await app.close();
  });
});
