import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { CharacterSort, PaginatedCharactersResponseDTO } from "@aeria/shared";
import CharactersPage from "@/pages/CharactersPage";

const { getCharactersMock, getCharacterFactOfDayMock } = vi.hoisted(() => ({
  getCharactersMock: vi.fn(),
  getCharacterFactOfDayMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getCharacters: getCharactersMock,
  getCharacterFactOfDay: getCharacterFactOfDayMock
}));

type CharacterItem = PaginatedCharactersResponseDTO["items"][number];

function locationParams() {
  const raw = screen.getByTestId("location-search").textContent ?? "";
  return new URLSearchParams(raw);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderCharactersPage(initialEntry = "/characters") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationProbe />
        <CharactersPage />
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

function paginated(items: CharacterItem[]): PaginatedCharactersResponseDTO {
  return {
    items,
    total: items.length,
    page: 1,
    limit: 100
  };
}

describe("CharactersPage catalog smoke", () => {
  beforeEach(() => {
    getCharactersMock.mockReset();
    getCharacterFactOfDayMock.mockReset();
  });

  it("renders fact of day section with author avatar and character catalog", async () => {
    getCharactersMock.mockResolvedValue(
      paginated([
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          name_native: null,
          tagline: "Кондитер-экспериментатор",
          avatar_asset_path: "/assets/images/characters/character-001.png",
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ru-example",
            url: "/atlas/ru-example",
            type: "country",
            title_ru: "Страна 01",
            summary: null,
            avatar_asset_path: null,
            flag_colors: ["#111111", "#ffffff"]
          },
          affiliation: {
            id: "00000000-0000-0000-0000-000000000051",
            slug: "atlas-001",
            url: "/atlas/atlas-001",
            type: "organization",
            title_ru: "Бастида де ла Люн д'Ор",
            summary: null,
            avatar_asset_path: "/assets/images/atlas/atlas-001.png",
            flag_colors: null
          }
        }
      ])
    );

    getCharacterFactOfDayMock.mockResolvedValue({
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
    });

    renderCharactersPage();

    await waitFor(() => {
      expect(screen.queryByTestId("characters-fact-skeleton")).not.toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Рубрика! Факт дня" })).toBeInTheDocument();
    expect(screen.getByTestId("section-break-star-1")).toBeInTheDocument();
    expect(screen.getByTestId("characters-catalog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Поиск по персонажам...")).toBeInTheDocument();
    expect(screen.getByTestId("characters-filter-button")).toBeInTheDocument();
    expect(screen.getAllByTestId("characters-catalog-item")[0]).toHaveAttribute("href", "/characters/character-001");
  });

  it("renders fact empty state and catalog fallback labels when no fact is available", async () => {
    getCharactersMock.mockResolvedValue(
      paginated([
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          name_native: null,
          tagline: null,
          avatar_asset_path: "/assets/images/characters/character-001.png",
          country: null,
          affiliation: null
        }
      ])
    );

    getCharacterFactOfDayMock.mockResolvedValue(null);

    renderCharactersPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Лилетт/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Блок уже на месте\./i)).toBeInTheDocument();
    expect(screen.queryByText("Страна не указана")).not.toBeInTheDocument();
    expect(screen.getByText("Принадлежность не указана")).toBeInTheDocument();
  });

  it("syncs search and filters with URL and updates characters query", async () => {
    const baseItems: CharacterItem[] = [
      {
        id: "00000000-0000-0000-0000-000000000031",
        slug: "character-001",
        url: "/characters/character-001",
        name_ru: "Лилетт Коломбель",
        name_native: null,
        tagline: "Кондитер-экспериментатор",
        avatar_asset_path: "/assets/images/characters/character-001.png",
        country: {
          id: "00000000-0000-0000-0000-000000000021",
          slug: "ru-example",
          url: "/atlas/ru-example",
          type: "country",
          title_ru: "Страна 01",
          summary: null,
          avatar_asset_path: null,
          flag_colors: ["#111111", "#ffffff"]
        },
        affiliation: {
          id: "00000000-0000-0000-0000-000000000051",
          slug: "atlas-001",
          url: "/atlas/atlas-001",
          type: "organization",
          title_ru: "Бастида",
          summary: null,
          avatar_asset_path: null,
          flag_colors: null
        }
      },
      {
        id: "00000000-0000-0000-0000-000000000032",
        slug: "character-002",
        url: "/characters/character-002",
        name_ru: "Рейна Като",
        name_native: null,
        tagline: "Brill.Arc",
        avatar_asset_path: "/assets/images/characters/character-002.png",
        country: {
          id: "00000000-0000-0000-0000-000000000022",
          slug: "jp-example",
          url: "/atlas/jp-example",
          type: "country",
          title_ru: "Страна 02",
          summary: null,
          avatar_asset_path: null,
          flag_colors: ["#ff0000", "#ffffff"]
        },
        affiliation: {
          id: "00000000-0000-0000-0000-000000000052",
          slug: "atlas-002",
          url: "/atlas/atlas-002",
          type: "organization",
          title_ru: "Brill.Arc",
          summary: null,
          avatar_asset_path: null,
          flag_colors: null
        }
      }
    ];

    getCharactersMock.mockImplementation(async (params?: {
      q?: string;
      country?: string;
      affiliation?: string;
      sort?: CharacterSort;
    }) => {
      let items = [...baseItems];
      const q = params?.q?.toLowerCase();

      if (q) {
        items = items.filter(
          (item) => item.name_ru.toLowerCase().includes(q) || (item.tagline ?? "").toLowerCase().includes(q)
        );
      }

      if (params?.country) {
        items = items.filter((item) => item.country?.slug === params.country);
      }

      if (params?.affiliation) {
        items = items.filter((item) => item.affiliation?.slug === params.affiliation);
      }

      const sort = params?.sort ?? "name_asc";
      items.sort((a, b) =>
        sort === "name_desc"
          ? b.name_ru.localeCompare(a.name_ru, "ru")
          : a.name_ru.localeCompare(b.name_ru, "ru")
      );

      return paginated(items);
    });

    getCharacterFactOfDayMock.mockResolvedValue(null);

    renderCharactersPage();

    await waitFor(() => {
      expect(screen.getAllByTestId("characters-catalog-item")).toHaveLength(2);
    });

    fireEvent.change(screen.getByPlaceholderText("Поиск по персонажам..."), {
      target: { value: "Рейна" }
    });

    await waitFor(() => {
      expect(locationParams().get("q")).toBe("Рейна");
    });

    await waitFor(() => {
      expect(screen.getAllByTestId("characters-catalog-item")).toHaveLength(1);
    });

    fireEvent.click(screen.getByTestId("characters-filter-button"));
    await chooseSelectOption("characters-filter-country", "Страна 02");

    await waitFor(() => {
      expect(locationParams().get("country")).toBe("jp-example");
    });

    await chooseSelectOption("characters-filter-sort", "По имени (Я-А)");

    await waitFor(() => {
      expect(locationParams().get("sort")).toBe("name_desc");
    });

    await waitFor(() => {
      expect(
        getCharactersMock.mock.calls.some((call) => {
          const params = call[0] as { q?: string; country?: string; sort?: CharacterSort } | undefined;
          return params?.q === "Рейна" && params?.country === "jp-example" && params?.sort === "name_desc";
        })
      ).toBe(true);
    });
  });
});
