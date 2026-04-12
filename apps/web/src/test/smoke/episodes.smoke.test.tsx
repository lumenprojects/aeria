import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type {
  PaginatedCharactersResponseDTO,
  PaginatedEpisodesResponseDTO,
  PaginatedSeriesResponseDTO,
  SeriesDetailResponseDTO
} from "@aeria/shared";
import EpisodesPage from "@/pages/EpisodesPage";

const { getEpisodesMock, getSeriesMock, getSeriesListMock, getCharactersMock, getHomeSnapshotMock } = vi.hoisted(() => ({
  getEpisodesMock: vi.fn(),
  getSeriesMock: vi.fn(),
  getSeriesListMock: vi.fn(),
  getCharactersMock: vi.fn(),
  getHomeSnapshotMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getEpisodes: getEpisodesMock,
  getSeries: getSeriesMock,
  getSeriesList: getSeriesListMock,
  getCharacters: getCharactersMock,
  getHomeSnapshot: getHomeSnapshotMock
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

async function chooseSelectOption(testId: string, label: string) {
  const trigger = screen.getByTestId(testId);
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  fireEvent.click(trigger);
  const listbox = await screen.findByRole("listbox");
  fireEvent.click(within(listbox).getByText(label));
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
      country_entity_id: "00000000-0000-0000-0000-000000000021",
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
        type: "country",
        title_ru: "Авзония",
        summary: null,
        avatar_asset_path: null,
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
      country_entity_id: "00000000-0000-0000-0000-000000000022",
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
        type: "country",
        title_ru: "Люмия",
        summary: null,
        avatar_asset_path: null,
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
    getHomeSnapshotMock.mockReset();

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

    getHomeSnapshotMock.mockResolvedValue({
      latest_episode: {
        id: "00000000-0000-0000-0000-000000000002",
        slug: "episode-002",
        url: "/episodes/episode-002",
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
          type: "country",
          title_ru: "Люмия",
          summary: null,
          avatar_asset_path: null,
          flag_colors: ["#202020", "#efefef", "#ffb44b"]
        },
        series: {
          id: "00000000-0000-0000-0000-000000000011",
          slug: "yellow-moon",
          url: "/episodes?series=yellow-moon",
          title_ru: "Жёлтая Луна",
          brand_color: "#f2b14b"
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
    });
  });

  it("renders editorial catalog layout with series context and episode rows", async () => {
    renderEpisodesPage("/episodes?series=yellow-moon");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Самый свежий Эпизод" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Le souffle de la route" })).toBeInTheDocument();
    });

    expect(screen.queryByText("Последняя глава")).not.toBeInTheDocument();
    expect(screen.getByTestId("episodes-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("episodes-latest-release")).toBeInTheDocument();
    expect(screen.getByTestId("episodes-faq")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Что такое Эпизоды\s?\?/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /А что значит Серия Эпизодов\s?\?/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Почему номера эпизодов иногда совпадают?" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Поиск по главам...")).toBeInTheDocument();
    expect(screen.getByTestId("episodes-filter-button")).toBeInTheDocument();
    expect(screen.getByTestId("episodes-series-context")).toBeInTheDocument();
    expect(screen.getByText("Серия")).toBeInTheDocument();
    expect(
      screen.getByText("Серия о дорогах, письмах и людях, которые опаздывают к собственным решениям.")
    ).toBeInTheDocument();
    expect(screen.getByText("В серии 2 эпизода")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Показать весь каталог" })).toBeInTheDocument();

    expect(screen.getAllByTestId("episodes-catalog-item")).toHaveLength(2);
    expect(screen.getAllByTestId("episodes-catalog-item")[0]).toHaveAttribute("href", "/episodes/episode-002");
    expect(screen.getAllByText("Жёлтая Луна").length).toBeGreaterThan(1);
    expect(screen.getByTitle("Амэ")).toBeInTheDocument();
    expect(document.querySelectorAll(".section-break-line")).toHaveLength(0);
  });

  it("syncs local search and filters with URL while preserving catalog context", async () => {
    renderEpisodesPage("/episodes");

    await waitFor(() => {
      expect(screen.getAllByTestId("episodes-catalog-item")).toHaveLength(2);
    });

    expect(screen.getAllByTestId("episodes-catalog-item")[0]).toHaveAttribute("href", "/episodes/episode-002");

    fireEvent.click(screen.getByTestId("episodes-filter-button"));
    await chooseSelectOption("episodes-filter-character", "Амэ");

    await waitFor(() => {
      expect(locationParams().get("character")).toBe("ame");
    });

    await chooseSelectOption("episodes-filter-series", "Жёлтая Луна");

    await waitFor(() => {
      expect(locationParams().get("series")).toBe("yellow-moon");
    });

    await chooseSelectOption("episodes-filter-sort", "Новые -> старые");

    await waitFor(() => {
      expect(locationParams().get("sort")).toBeNull();
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
