import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type {
  PaginatedCharactersResponseDTO,
  PaginatedEpisodesResponseDTO,
  PaginatedSeriesResponseDTO,
  SeriesDetailResponseDTO
} from "@aeria/shared";
import EpisodesPage from "@/pages/EpisodesPage";

const { getEpisodesMock, getSeriesMock, getSeriesListMock, getCharactersMock } = vi.hoisted(() => ({
  getEpisodesMock: vi.fn(),
  getSeriesMock: vi.fn(),
  getSeriesListMock: vi.fn(),
  getCharactersMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getEpisodes: getEpisodesMock,
  getSeries: getSeriesMock,
  getSeriesList: getSeriesListMock,
  getCharacters: getCharactersMock
}));

type EpisodeItem = PaginatedEpisodesResponseDTO["items"][number];

function locationParams() {
  const raw = screen.getByTestId("location-search").textContent ?? "";
  return new URLSearchParams(raw);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderEpisodesPage(initialEntry = "/episodes") {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <EpisodesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function paginated(items: EpisodeItem[]): PaginatedEpisodesResponseDTO {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 100
  };
}

describe("EpisodesPage smoke", () => {
  const baseItems: EpisodeItem[] = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      slug: "episode-001",
      url: "/episodes/episode-001",
      series_id: "00000000-0000-0000-0000-000000000011",
      country_id: "00000000-0000-0000-0000-000000000021",
      episode_number: 1,
      global_order: 1,
      title_native: "Au-dela des vignes",
      title_ru: "За пределами виноградников",
      summary: "Письмо с чужим именем.",
      reading_minutes: 11,
      published_at: null,
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      participants: [
        {
          id: "00000000-0000-0000-0000-000000000101",
          slug: "ame",
          url: "/characters/ame",
          name_ru: "Амэ",
          avatar_asset_path: "/assets/images/characters/ame.png"
        }
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      slug: "episode-002",
      url: "/episodes/episode-002",
      series_id: "00000000-0000-0000-0000-000000000011",
      country_id: "00000000-0000-0000-0000-000000000022",
      episode_number: 2,
      global_order: 2,
      title_native: "Le souffle de la route",
      title_ru: "Дыхание дороги",
      summary: "Ночь срывает прежние договорённости.",
      reading_minutes: 7,
      published_at: null,
      country: {
        id: "00000000-0000-0000-0000-000000000022",
        slug: "lumia",
        url: "/atlas/lumia",
        title_ru: "Люмия",
        flag_colors: ["#202020", "#efefef", "#ffb44b"]
      },
      participants: [
        {
          id: "00000000-0000-0000-0000-000000000102",
          slug: "forsil-villet",
          url: "/characters/forsil-villet",
          name_ru: "Форсил Виллет",
          avatar_asset_path: "/assets/images/characters/forsil-villet.png"
        }
      ]
    }
  ];

  beforeEach(() => {
    getEpisodesMock.mockReset();
    getSeriesMock.mockReset();
    getSeriesListMock.mockReset();
    getCharactersMock.mockReset();

    getEpisodesMock.mockImplementation(async (params?: { character?: string; series?: string; sort?: string }) => {
      let items = [...baseItems];

      if (params?.character) {
        items = items.filter((item) => item.participants.some((participant) => participant.slug === params.character));
      }

      if (params?.series) {
        items = items.filter(() => params.series === "yellow-moon");
      }

      if (params?.sort === "newest") {
        items.reverse();
      }

      return paginated(items);
    });

    getSeriesMock.mockResolvedValue({
      series: {
        id: "00000000-0000-0000-0000-000000000011",
        slug: "yellow-moon",
        url: "/episodes?series=yellow-moon",
        title_ru: "Жёлтая Луна",
        brand_color: "#f2b14b",
        summary: "Серия о дорогах, письмах и людях, которые опаздывают к собственным решениям."
      },
      episodes: baseItems
    } satisfies SeriesDetailResponseDTO);

    getSeriesListMock.mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000011",
          slug: "yellow-moon",
          url: "/episodes?series=yellow-moon",
          title_ru: "Жёлтая Луна",
          brand_color: "#f2b14b",
          summary: "Серия о дорогах, письмах и людях, которые опаздывают к собственным решениям."
        }
      ],
      total: 1,
      page: 1,
      limit: 100
    } satisfies PaginatedSeriesResponseDTO);

    getCharactersMock.mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000101",
          slug: "ame",
          url: "/characters/ame",
          name_ru: "Амэ",
          name_native: null,
          avatar_asset_path: "/assets/images/characters/ame.png",
          tagline: null,
          country: null,
          affiliation: null
        },
        {
          id: "00000000-0000-0000-0000-000000000102",
          slug: "forsil-villet",
          url: "/characters/forsil-villet",
          name_ru: "Форсил Виллет",
          name_native: null,
          avatar_asset_path: "/assets/images/characters/forsil-villet.png",
          tagline: null,
          country: null,
          affiliation: null
        }
      ],
      total: 2,
      page: 1,
      limit: 100
    } satisfies PaginatedCharactersResponseDTO);
  });

  it("renders editorial catalog layout with series context and episode rows", async () => {
    renderEpisodesPage("/episodes?series=yellow-moon");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Эпизоды" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("episodes-catalog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Поиск по главам...")).toBeInTheDocument();
    expect(screen.getByTestId("episodes-filter-button")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("episodes-catalog-summary")).toHaveTextContent("Жёлтая Луна");
    });

    expect(screen.getAllByTestId("episodes-catalog-item")).toHaveLength(2);
    expect(screen.getAllByTestId("episodes-catalog-item")[0]).toHaveAttribute("href", "/episodes/episode-001");
    expect(screen.getAllByText("Жёлтая Луна").length).toBeGreaterThan(1);
    expect(screen.getByTitle("Амэ")).toBeInTheDocument();
  });

  it("syncs local search and filters with URL while preserving catalog context", async () => {
    renderEpisodesPage("/episodes");

    await waitFor(() => {
      expect(screen.getAllByTestId("episodes-catalog-item")).toHaveLength(2);
    });

    fireEvent.click(screen.getByTestId("episodes-filter-button"));
    fireEvent.change(screen.getByTestId("episodes-filter-character"), {
      target: { value: "ame" }
    });

    await waitFor(() => {
      expect(locationParams().get("character")).toBe("ame");
    });

    fireEvent.change(screen.getByTestId("episodes-filter-series"), {
      target: { value: "yellow-moon" }
    });

    await waitFor(() => {
      expect(locationParams().get("series")).toBe("yellow-moon");
    });

    fireEvent.change(screen.getByTestId("episodes-filter-sort"), {
      target: { value: "newest" }
    });

    await waitFor(() => {
      expect(locationParams().get("sort")).toBe("newest");
    });

    fireEvent.change(screen.getByPlaceholderText("Поиск по главам..."), {
      target: { value: "Письмо" }
    });

    await waitFor(() => {
      expect(locationParams().get("q")).toBe("Письмо");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("episodes-catalog-item")).toHaveLength(1);
    });

    await waitFor(() => {
      expect(
        getEpisodesMock.mock.calls.some((call) => {
          const params = call[0] as { character?: string; series?: string; sort?: string } | undefined;
          return params?.character === "ame" && params?.series === "yellow-moon" && params?.sort === "newest";
        })
      ).toBe(true);
    });
  });
});
