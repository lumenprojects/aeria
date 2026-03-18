import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { AtlasCatalogResponseDTO, AtlasCatalogSort, WorldNodeListItemDTO } from "@aeria/shared";
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

function buildResponse(items: WorldNodeListItemDTO[]): AtlasCatalogResponseDTO {
  const countryFacetMap = new Map<string, { id: string; slug: string; title_ru: string; count: number }>();
  for (const item of items) {
    const country = item.country;
    if (!country) continue;
    const current = countryFacetMap.get(country.slug);
    if (current) {
      current.count += 1;
      continue;
    }
    countryFacetMap.set(country.slug, {
      id: country.id,
      slug: country.slug,
      title_ru: country.title_ru,
      count: 1
    });
  }

  return {
    items,
    facets: {
      entity: [
        { value: "country", label: "Страны", count: items.filter((item) => item.node_type === "country").length },
        { value: "location", label: "Локации", count: items.filter((item) => item.node_type === "location").length },
        { value: "atlas_entry", label: "Записи атласа", count: items.filter((item) => item.node_type === "atlas_entry").length }
      ],
      kind: [
        { value: "geography", label: "География", count: items.filter((item) => item.kind === "geography").length },
        { value: "social", label: "Социальное", count: items.filter((item) => item.kind === "social").length },
        { value: "history", label: "История", count: items.filter((item) => item.kind === "history").length },
        { value: "belief", label: "Вера", count: items.filter((item) => item.kind === "belief").length },
        { value: "object", label: "Объект", count: items.filter((item) => item.kind === "object").length },
        { value: "event", label: "Событие", count: items.filter((item) => item.kind === "event").length },
        { value: "other", label: "Другое", count: items.filter((item) => item.kind === "other").length }
      ],
      country: [...countryFacetMap.values()],
      anchor: [
        { value: "country", label: "Страна", count: items.filter((item) => item.anchor_mode === "country").length },
        { value: "location", label: "Локация", count: items.filter((item) => item.anchor_mode === "location").length },
        { value: "free", label: "Свободные", count: items.filter((item) => item.anchor_mode === "free").length }
      ]
    },
    total: items.length,
    page: 1,
    limit: 200
  };
}

describe("AtlasPage catalog smoke", () => {
  const baseItems: WorldNodeListItemDTO[] = [
    {
      node_type: "country",
      id: "00000000-0000-0000-0000-000000000021",
      slug: "ausonia",
      url: "/atlas/ausonia",
      title_ru: "Авзония",
      summary: null,
      kind: null,
      avatar_asset_path: null,
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      location: null,
      anchor_mode: "country",
      related_count: 3,
      published_at: null
    },
    {
      node_type: "location",
      id: "00000000-0000-0000-0000-000000000041",
      slug: "doroga-na-sever",
      url: "/atlas/doroga-na-sever",
      title_ru: "Дорога на север",
      summary: "Маршрут, который держит торговлю и слухи в одном ритме.",
      kind: null,
      avatar_asset_path: null,
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      location: {
        id: "00000000-0000-0000-0000-000000000041",
        slug: "doroga-na-sever",
        url: "/atlas/doroga-na-sever",
        title_ru: "Дорога на север",
        avatar_asset_path: null,
        country: {
          id: "00000000-0000-0000-0000-000000000021",
          slug: "ausonia",
          url: "/atlas/ausonia",
          title_ru: "Авзония",
          flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
        }
      },
      anchor_mode: "location",
      related_count: 1,
      published_at: null
    },
    {
      node_type: "atlas_entry",
      id: "00000000-0000-0000-0000-000000000051",
      slug: "bastida-de-la-lune",
      url: "/atlas/bastida-de-la-lune",
      title_ru: "Бастида де ла Люн",
      summary: "Городская ткань вокруг рынков, дворов и разговоров.",
      kind: "social",
      avatar_asset_path: null,
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      location: null,
      anchor_mode: "country",
      related_count: 2,
      published_at: "2026-03-15T00:00:00.000Z"
    },
    {
      node_type: "atlas_entry",
      id: "00000000-0000-0000-0000-000000000052",
      slug: "prazdnik-immortelles",
      url: "/atlas/prazdnik-immortelles",
      title_ru: "Праздник иммортелей",
      summary: "Сезонный ритуал памяти и торговли.",
      kind: "event",
      avatar_asset_path: null,
      country: null,
      location: null,
      anchor_mode: "free",
      related_count: 1,
      published_at: "2026-03-16T00:00:00.000Z"
    }
  ];

  beforeEach(() => {
    getAtlasCatalogMock.mockReset();
    getAtlasCatalogMock.mockImplementation(
      async (params?: {
        q?: string;
        entity?: string;
        country?: string;
        kind?: string;
        anchor?: string;
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
        if (params?.entity) items = items.filter((item) => item.node_type === params.entity);
        if (params?.country) items = items.filter((item) => item.country?.slug === params.country || item.slug === params.country);
        if (params?.kind) items = items.filter((item) => item.kind === params.kind);
        if (params?.anchor) items = items.filter((item) => item.anchor_mode === params.anchor);

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

  it("renders atlas world index with grouped sections and rows", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Атлас" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("atlas-world-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-world-search")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("world-node-row")).toHaveLength(4);
    });

    expect(screen.getByTestId("atlas-group-country")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-group-location")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-group-atlas_entry")).toBeInTheDocument();
    expect(screen.getAllByTestId("world-node-row")[0]).toHaveAttribute("href", "/atlas/ausonia");
  });

  it("syncs search and visible filters with URL and atlas catalog query", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getAllByTestId("world-node-row")).toHaveLength(4);
    });

    fireEvent.change(screen.getByTestId("atlas-world-search"), {
      target: { value: "дорога" }
    });

    await waitFor(() => {
      expect(locationParams().get("q")).toBe("дорога");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("world-node-row")).toHaveLength(1);
    });

    await chooseSelectOption("atlas-world-filter-entity", "Локации");
    await chooseSelectOption("atlas-world-filter-country", "Авзония");
    await chooseSelectOption("atlas-world-filter-sort", "Сначала новое");

    await waitFor(() => {
      expect(locationParams().get("entity")).toBe("location");
      expect(locationParams().get("country")).toBe("ausonia");
      expect(locationParams().get("sort")).toBe("recent");
    });

    await waitFor(() => {
      expect(
        getAtlasCatalogMock.mock.calls.some((call) => {
          const params = call[0] as
            | {
                limit?: number;
                q?: string;
                entity?: string;
                country?: string;
                sort?: AtlasCatalogSort;
              }
            | undefined;
          return (
            params?.limit === 100 &&
            params?.q === "дорога" &&
            params?.entity === "location" &&
            params?.country === "ausonia" &&
            params?.sort === "recent"
          );
        })
      ).toBe(true);
    });
  });
});
