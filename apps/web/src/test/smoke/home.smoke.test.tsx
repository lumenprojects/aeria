import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";

vi.mock("@/lib/api", () => ({
  getHomeSnapshot: vi.fn().mockResolvedValue({
    latest_episode: {
      id: "00000000-0000-0000-0000-000000000001",
      slug: "episode-001",
      url: "/episodes/episode-001",
      episode_number: 1,
      global_order: 1,
      title_native: "Au-dela des vignes",
      title_ru: "За пределами виноградников",
      summary: "Письмо с чужим именем.",
      reading_minutes: 3,
      published_at: "2026-03-07T00:00:00.000Z",
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ru-example",
        url: "/atlas/ru-example",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      series: {
        id: "00000000-0000-0000-0000-000000000011",
        slug: "series-01",
        url: "/episodes?series=series-01",
        title_ru: "Жёлтая луна",
        brand_color: "#f2b14b"
      },
      participants: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт Коломбель",
          avatar_asset_path: "/assets/images/characters/lilette-colombel.png"
        }
      ]
    },
    about_profile: {
      id: "00000000-0000-0000-0000-000000000099",
      slug: "ame",
      url: "/characters/ame",
      name_ru: "Амэ",
      avatar_asset_path: "/assets/images/characters/ame.png",
      home_intro_title: "Привет, я Амэ",
      home_intro_markdown: "А это **Aeria**."
    },
    world_quote: {
      id: 1,
      quote: "У нас не было героев. Только сосед, который умел дышать через уши.",
      source: "Услышано у костра"
    }
  }),
  getRandomHomeWorldQuote: vi.fn().mockResolvedValue({
    id: 2,
    quote: "Старая лестница знает больше новостей, чем городская площадь.",
    source: "Услышано на лестничной клетке"
  }),
  getCharacter: vi.fn(async (slug: string) => {
    const entries: Record<string, { name_ru: string; avatar_asset_path: string }> = {
      "character-001": {
        name_ru: "Character 001",
        avatar_asset_path: "/assets/images/characters/lilette-colombel.png"
      },
      ame: {
        name_ru: "Амэ",
        avatar_asset_path: "/assets/images/characters/ame.png"
      },
      "character-003": {
        name_ru: "Character 003",
        avatar_asset_path: "/assets/images/characters/margo-varren.png"
      },
      "character-002": {
        name_ru: "Character 002",
        avatar_asset_path: "/assets/images/characters/lucien-mariel.png"
      }
    };

    const character = entries[slug];
    if (!character) throw new Error(`Character mock not found for slug: ${slug}`);
    return { character };
  }),
  getAtlasEntry: vi.fn(async (slug: string) => {
    const entries: Record<string, { title_ru: string; avatar_asset_path: string }> = {
      "capital-example": {
        title_ru: "Capital Example",
        avatar_asset_path: "/assets/images/locations/capital-example.png"
      },
      "atlas-001": {
        title_ru: "Atlas 001",
        avatar_asset_path: "/assets/images/atlas/bastida-lion-dor.png"
      }
    };

    const entry = entries[slug];
    if (!entry) throw new Error(`Atlas mock not found for slug: ${slug}`);
    return { entry };
  })
}));

function renderLandingPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("LandingPage smoke", () => {
  it("renders home sections with country carousel and line boundaries", async () => {
    const view = renderLandingPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Au-dela des vignes" })).toBeInTheDocument();
    });

    const aboutHeading = screen.getByRole("heading", { name: "Привет, я Амэ" });
    const conveyorHeading = screen.getByRole("heading", { name: /Ваше личное пространство для погружения/i });
    const carousel = screen.getByTestId("home-country-carousel");
    const countrySnapshot = screen.getByTestId("home-country-snapshot");

    expect(screen.getByText("За пределами виноградников")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Читать/i })).toHaveAttribute("href", "/episodes/episode-001");
    expect(screen.getByRole("link", { name: "Открыть скрытую страницу Амэ" })).toHaveAttribute("href", "/characters/ame");
    expect(screen.getByText("« У нас не было героев. Только сосед, который умел дышать через уши. »")).toBeInTheDocument();
    expect(screen.getByText("— Услышано у костра —")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Подслушать ещё" })).toBeInTheDocument();
    expect(screen.getByTestId("home-country-carousel-dots").querySelectorAll("button")).toHaveLength(6);
    expect(view.container.querySelectorAll(".home-country-carousel-dot-active")).toHaveLength(1);
    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(4);
    expect(view.container.querySelectorAll(".section-break-stars")).toHaveLength(1);

    expect(aboutHeading.compareDocumentPosition(carousel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(carousel.compareDocumentPosition(countrySnapshot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(carousel.compareDocumentPosition(conveyorHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Capital Example" })[0]).toHaveAttribute("href", "/atlas/capital-example");
    });

    expect(screen.getAllByRole("link", { name: "Character 003" })[0]).toHaveAttribute("href", "/characters/character-003");
  });
});
