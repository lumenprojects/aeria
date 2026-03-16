import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { AtlasSort, PaginatedAtlasResponseDTO } from "@aeria/shared";
import AtlasPage from "@/pages/AtlasPage";

const { getAtlasMock } = vi.hoisted(() => ({
  getAtlasMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getAtlas: getAtlasMock
}));

type AtlasItem = PaginatedAtlasResponseDTO["items"][number];

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

function paginated(items: AtlasItem[]): PaginatedAtlasResponseDTO {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 100
  };
}

describe("AtlasPage catalog smoke", () => {
  const baseItems: AtlasItem[] = [
    {
      id: "00000000-0000-0000-0000-000000000051",
      slug: "bastida-de-la-lune",
      url: "/atlas/bastida-de-la-lune",
      kind: "social",
      title_ru: "Бастида де ла Люн",
      summary: "Городская ткань вокруг рынков, дворов и разговоров.",
      country_id: "00000000-0000-0000-0000-000000000021",
      location_id: null
    },
    {
      id: "00000000-0000-0000-0000-000000000052",
      slug: "doroga-na-sever",
      url: "/atlas/doroga-na-sever",
      kind: "geography",
      title_ru: "Дорога на север",
      summary: "Маршрут, который держит торговлю и слухи в одном ритме.",
      country_id: null,
      location_id: "00000000-0000-0000-0000-000000000041"
    },
    {
      id: "00000000-0000-0000-0000-000000000053",
      slug: "prazdnik-immortelles",
      url: "/atlas/prazdnik-immortelles",
      kind: "event",
      title_ru: "Праздник иммортелей",
      summary: "Сезонный ритуал памяти и торговли.",
      country_id: null,
      location_id: null
    }
  ];

  beforeEach(() => {
    getAtlasMock.mockReset();

    getAtlasMock.mockImplementation(async (params?: { q?: string; kind?: string; sort?: AtlasSort }) => {
      let items = [...baseItems];
      const query = params?.q?.toLowerCase();

      if (query) {
        items = items.filter(
          (item) =>
            item.title_ru.toLowerCase().includes(query) || (item.summary ?? "").toLowerCase().includes(query)
        );
      }

      if (params?.kind) {
        items = items.filter((item) => item.kind === params.kind);
      }

      const sort = params?.sort ?? "title_asc";
      items.sort((a, b) =>
        sort === "title_desc"
          ? b.title_ru.localeCompare(a.title_ru, "ru")
          : a.title_ru.localeCompare(b.title_ru, "ru")
      );

      return paginated(items);
    });
  });

  it("renders atlas catalog with its map panel and sigil list", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Атлас" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("atlas-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-catalog-map")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Поиск по атласу...")).toBeInTheDocument();
    expect(screen.getByTestId("atlas-filter-button")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-catalog-item")).toHaveLength(3);
    });

    expect(screen.getAllByTestId("atlas-catalog-item")).toHaveLength(3);
    expect(screen.getAllByTestId("atlas-catalog-item")[0]).toHaveAttribute("href", "/atlas/bastida-de-la-lune");
    expect(screen.getAllByText("GEO").length).toBeGreaterThan(1);
  });

  it("syncs search and drawer filters with URL and atlas query", async () => {
    renderAtlasPage();

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-catalog-item")).toHaveLength(3);
    });

    fireEvent.change(screen.getByPlaceholderText("Поиск по атласу..."), {
      target: { value: "дорога" }
    });

    await waitFor(() => {
      expect(locationParams().get("q")).toBe("дорога");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("atlas-catalog-item")).toHaveLength(1);
    });

    fireEvent.click(screen.getByTestId("atlas-filter-button"));
    fireEvent.change(screen.getByTestId("atlas-filter-kind"), {
      target: { value: "geography" }
    });

    await waitFor(() => {
      expect(locationParams().get("kind")).toBe("geography");
    });

    fireEvent.change(screen.getByTestId("atlas-filter-sort"), {
      target: { value: "title_desc" }
    });

    await waitFor(() => {
      expect(locationParams().get("sort")).toBe("title_desc");
    });

    await waitFor(() => {
      expect(
        getAtlasMock.mock.calls.some((call) => {
          const params = call[0] as { q?: string; kind?: string; sort?: AtlasSort } | undefined;
          return params?.q === "дорога" && params?.kind === "geography" && params?.sort === "title_desc";
        })
      ).toBe(true);
    });
  });
});
