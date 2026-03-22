import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { AtlasCatalogItemDTO, AtlasCatalogResponseDTO, AtlasCatalogSort } from "@aeria/shared";
import AtlasPage from "@/pages/AtlasPage";

const { getAtlasCatalogMock } = vi.hoisted(() => ({
  getAtlasCatalogMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getAtlasCatalog: getAtlasCatalogMock
}));

function locationParams() {
  const raw = screen.getByTestId("location-search").textContent ?? "";
  return new URLSearchParams(raw);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderAtlasPage(initialEntry = "/atlas") {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <AtlasPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function chooseSelectOption(testId: string, label: string) {
  const trigger = screen.getByTestId(testId);
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
  const listbox = await screen.findByRole("listbox");
  fireEvent.click(within(listbox).getByText(label));
}

function atlasRef(slug: string, title_ru: string, type: AtlasCatalogItemDTO["type"] = "country") {
  return {
    id: `${slug}-id`,
    slug,
    url: `/atlas/${slug}`,
    type,
    title_ru,
    summary: null,
    avatar_asset_path: null,
    flag_colors: type === "country" ? ["#d72638", "#f5f1ea", "#1d5fa7"] : null
  } as const;
}

function buildResponse(items: AtlasCatalogItemDTO[]): AtlasCatalogResponseDTO {
  const countryFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();
  const locationFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();

  for (const item of items) {
    if (item.country) {
      const current = countryFacetMap.get(item.country.slug);
      if (current) current.count += 1;
      else {
        countryFacetMap.set(item.country.slug, {
          id: item.country.id,
          slug: item.country.slug,
          title_ru: item.country.title_ru,
          count: 1
        });
      }
    }

    const location = item.location ?? (item.type === "location" ? item : null);
    if (location) {
      const current = locationFacetMap.get(location.slug);
      if (current) current.count += 1;
      else {
        locationFacetMap.set(location.slug, {
          id: location.id,
          slug: location.slug,
          title_ru: location.title_ru,
          count: 1
        });
      }
    }
  }

  return {
    items,
    facets: {
      type: [
        { value: "country", label: "Страны", count: items.filter((item) => item.type === "country").length },
        { value: "location", label: "Локации", count: items.filter((item) => item.type === "location").length },
        { value: "organization", label: "Организации", count: items.filter((item) => item.type === "organization").length },
        { value: "event", label: "События", count: items.filter((item) => item.type === "event").length },
        { value: "object", label: "Объекты", count: 0 },
        { value: "belief", label: "Верования", count: 0 },
        { value: "concept", label: "Понятия", count: 0 },
        { value: "other", label: "Другое", count: 0 }
      ],
      section: [
        { value: "geography", label: "География", count: items.filter((item) => item.sections.includes("geography")).length },
        { value: "social", label: "Социальное", count: items.filter((item) => item.sections.includes("social")).length },
        { value: "history", label: "История", count: items.filter((item) => item.sections.includes("history")).length },
        { value: "belief", label: "Вера", count: items.filter((item) => item.sections.includes("belief")).length },
        { value: "object", label: "Объект", count: items.filter((item) => item.sections.includes("object")).length },
        { value: "event", label: "Событие", count: items.filter((item) => item.sections.includes("event")).length },
        { value: "other", label: "Другое", count: items.filter((item) => item.sections.includes("other")).length }
      ],
      country: [...countryFacetMap.values()],
      location: [...locationFacetMap.values()]
    },
    total: items.length,
    page: 1,
    limit: 200
  };
}

describe("AtlasPage catalog smoke", () => {
  const ausonia = atlasRef("ausonia", "Авзония");
  const road = atlasRef("doroga-na-sever", "Дорога на север", "location");

  const baseItems: AtlasCatalogItemDTO[] = [
    {
      id: "00000000-0000-0000-0000-000000000021",
      slug: "ausonia",
      url: "/atlas/ausonia",
      type: "country",
      title_ru: "Авзония",
      summary: null,
      avatar_asset_path: null,
      flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"],
      sections: ["geography"],
      country: null,
      location: null,
      related_count: 3,
      published_at: null
    },
    {
      id: "00000000-0000-0000-0000-000000000041",
      slug: "doroga-na-sever",
      url: "/atlas/doroga-na-sever",
      type: "location",
      title_ru: "Дорога на север",
      summary: "Маршрут, который держит торговлю и слухи в одном ритме.",
      avatar_asset_path: null,
      flag_colors: null,
      sections: ["geography"],
      country: ausonia,
      location: null,
      related_count: 1,
      published_at: null
    },
    {
      id: "00000000-0000-0000-0000-000000000051",
      slug: "bastida-de-la-lune",
      url: "/atlas/bastida-de-la-lune",
      type: "organization",
      title_ru: "Бастида де ла Люн",
      summary: "Городская ткань вокруг рынков, дворов и разговоров.",
      avatar_asset_path: null,
      flag_colors: null,
      sections: ["social"],
      country: ausonia,
      location: null,
      related_count: 2,
      published_at: "2026-03-15T00:00:00.000Z"
    },
    {
      id: "00000000-0000-0000-0000-000000000052",
      slug: "prazdnik-immortelles",
      url: "/atlas/prazdnik-immortelles",
      type: "event",
      title_ru: "Праздник иммортелей",
      summary: "Сезонный ритуал памяти и торговли.",
      avatar_asset_path: null,
      flag_colors: null,
      sections: ["event"],
      country: null,
      location: null,
      related_count: 1,
      published_at: "2026-03-16T00:00:00.000Z"
    }
  ];

  beforeEach(() => {
    getAtlasCatalogMock.mockReset();
    getAtlasCatalogMock.mockImplementation(
      async (params?: {
        q?: string;
        type?: string;
        country?: string;
        location?: string;
        section?: string;
        sort?: AtlasCatalogSort;
      }) => {
        let items = [...baseItems];
        const query = params?.q?.toLowerCase();

        if (query) {
          items = items.filter((item) =>
            [item.title_ru, item.summary ?? "", item.country?.title_ru ?? "", item.location?.title_ru ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(query)
          );
        }
        if (params?.type) items = items.filter((item) => item.type === params.type);
        if (params?.country) items = items.filter((item) => item.country?.slug === params.country);
        if (params?.location) items = items.filter((item) => item.location?.slug === params.location || item.slug === params.location);
        if (params?.section) items = items.filter((item) => item.sections.includes(params.section as AtlasCatalogItemDTO["sections"][number]));

        const sort = params?.sort ?? "title_asc";
        items.sort((a, b) => {
          if (sort === "recent") {
            const aTime = a.published_at ? Date.parse(a.published_at) : Number.NEGATIVE_INFINITY;
            const bTime = b.published_at ? Date.parse(b.published_at) : Number.NEGATIVE_INFINITY;
            if (aTime !== bTime) return bTime - aTime;
          }
          return sort === "title_desc"
            ? b.title_ru.localeCompare(a.title_ru, "ru")
            : a.title_ru.localeCompare(b.title_ru, "ru");
        });

        return buildResponse(items);
      }
    );
  });

  it("renders atlas world index as a single catalog list", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getByTestId("atlas-world-search")).toBeInTheDocument();
    });

    expect(screen.getByTestId("atlas-world-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-filter-button")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-entity-row")).toHaveLength(4);
    });

    expect(screen.getAllByTestId("atlas-entity-row")[0]).toHaveAttribute("href", "/atlas/ausonia");
  });

  it("syncs search and visible filters with URL and atlas catalog query", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-entity-row")).toHaveLength(4);
    });

    fireEvent.change(screen.getByTestId("atlas-world-search"), {
      target: { value: "Бастида" }
    });

    await waitFor(() => {
      expect(locationParams().get("q")).toBe("Бастида");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-entity-row")).toHaveLength(1);
    });

    fireEvent.click(screen.getByTestId("atlas-filter-button"));

    await waitFor(() => {
      expect(screen.getByTestId("atlas-filters-panel")).toBeInTheDocument();
    });

    await chooseSelectOption("atlas-world-filter-country", "Авзония");
    await chooseSelectOption("atlas-world-filter-section", "Социальное");
    await chooseSelectOption("atlas-world-filter-sort", "Сначала новое");

    await waitFor(() => {
      expect(locationParams().get("country")).toBe("ausonia");
      expect(locationParams().get("section")).toBe("social");
      expect(locationParams().get("sort")).toBe("recent");
    });

    await waitFor(() => {
      expect(
        getAtlasCatalogMock.mock.calls.some((call) => {
          const params = call[0] as
            | {
                limit?: number;
                q?: string;
                country?: string;
                section?: string;
                sort?: AtlasCatalogSort;
              }
            | undefined;
          return (
            params?.limit === 100 &&
            params?.q === "Бастида" &&
            params?.country === "ausonia" &&
            params?.section === "social" &&
            params?.sort === "recent"
          );
        })
      ).toBe(true);
    });
  });

  it("supports grouped atlas views without duplicating list rows outside the result area", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-entity-row")).toHaveLength(4);
    });

    fireEvent.click(screen.getByRole("button", { name: "Страны" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-catalog-group")).toHaveLength(2);
    });

    expect(screen.getAllByRole("heading", { name: "Авзония" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Без страны" }).length).toBeGreaterThan(0);
  });
});
