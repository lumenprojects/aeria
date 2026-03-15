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
  getCharacters: vi.fn().mockResolvedValue({
    items: [
      {
        id: "00000000-0000-0000-0000-000000000101",
        slug: "ame",
        url: "/characters/ame",
        name_ru: "Амэ",
        name_native: null,
        tagline: null,
        avatar_asset_path: "/assets/images/characters/ame.png",
        country: null,
        affiliation: null
      },
      {
        id: "00000000-0000-0000-0000-000000000102",
        slug: "forsil-villet",
        url: "/characters/forsil-villet",
        name_ru: "Форсиль Виллет",
        name_native: null,
        tagline: null,
        avatar_asset_path: "/assets/images/characters/forsil-villet.png",
        country: null,
        affiliation: null
      },
      {
        id: "00000000-0000-0000-0000-000000000103",
        slug: "mirai",
        url: "/characters/mirai",
        name_ru: "Мирай",
        name_native: null,
        tagline: null,
        avatar_asset_path: "/assets/images/characters/lumendor-placeholder.svg",
        country: null,
        affiliation: null
      }
    ],
    total: 3,
    page: 1,
    limit: 100
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
    expect(screen.getByTestId("home-country-carousel-dots").querySelectorAll("button")).toHaveLength(5);
    expect(view.container.querySelectorAll(".home-country-carousel-dot-active")).toHaveLength(1);
    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(6);
    expect(view.container.querySelectorAll(".section-break-stars")).toHaveLength(2);

    expect(aboutHeading.compareDocumentPosition(carousel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(carousel.compareDocumentPosition(countrySnapshot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(carousel.compareDocumentPosition(conveyorHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Форсиль Виллет" })[0]).toHaveAttribute("href", "/characters/forsil-villet");
    });

    expect(screen.getAllByRole("link", { name: "Мирай" })[0]).toHaveAttribute("href", "/characters/mirai");
    expect(screen.queryByRole("link", { name: "Амэ" })).not.toBeInTheDocument();
  });
});
