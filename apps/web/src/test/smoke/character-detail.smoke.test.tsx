import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CharacterDetailPage from "@/pages/CharacterDetailPage";

const { getCharacterMock } = vi.hoisted(() => ({
  getCharacterMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getCharacter: getCharacterMock
}));

function renderCharacterDetailPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/characters/forsil-villet"]}>
        <Routes>
          <Route path="/characters/:slug" element={<CharacterDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CharacterDetailPage smoke", () => {
  beforeEach(() => {
    getCharacterMock.mockReset();

    getCharacterMock.mockResolvedValue({
      character: {
        id: "00000000-0000-0000-0000-000000000001",
        slug: "forsil-villet",
        url: "/characters/forsil-villet",
        name_ru: "Форсиль Виллет",
        avatar_asset_path: "/assets/images/characters/forsil-villet.png",
        name_native: "Forsil Villet",
        affiliation_entity_id: "00000000-0000-0000-0000-000000000011",
        country_entity_id: "00000000-0000-0000-0000-000000000021",
        tagline: "Не всякую мягкость видно сразу.",
        gender: "Женский",
        race: "Человек",
        height_cm: 155,
        age: 20,
        orientation: "Гетеро",
        mbti: "ESTJ",
        favorite_food: "Макаруны",
        bio_markdown: "# Форсиль Виллет\n\nСенешаль, которая держит дом в ритме и тишине.",
        published_at: null
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        type: "country",
        title_ru: "Авзония",
        summary: "Виноградные долины и строгие дома.",
        avatar_asset_path: null,
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      affiliation: {
        id: "00000000-0000-0000-0000-000000000011",
        slug: "domaine-des-immortelles",
        url: "/atlas/domaine-des-immortelles",
        type: "location",
        title_ru: "Domaine des Immortelles",
        summary: "Поместье, где дом держится на распорядке.",
        avatar_asset_path: null,
        flag_colors: null
      },
      quirks: [
        {
          text: "Всегда замечает сбитую линию в чужом распорядке.",
          sort_order: 0
        },
        {
          text: "Слишком спокойно говорит, когда уже всё решила.",
          sort_order: 1
        }
      ],
      rumors: [
        {
          text: "С ней сложно спорить о цене, потому что она уже всё просчитала.",
          author_name: "Торговец тканями",
          author_meta: "городской лавочник",
          sort_order: 0,
          source: {
            type: "atlas_entity",
            id: "00000000-0000-0000-0000-000000000041",
            slug: "domaine-des-immortelles",
            url: "/atlas/domaine-des-immortelles",
            title: "Domaine des Immortelles",
            avatar_asset_path: null
          }
        }
      ],
      episodes: [
        {
          id: "00000000-0000-0000-0000-000000000101",
          slug: "za-predelami-vinogradnikov",
          url: "/episodes/za-predelami-vinogradnikov",
          series_id: "00000000-0000-0000-0000-000000000201",
          country_entity_id: "00000000-0000-0000-0000-000000000021",
          episode_number: 2,
          global_order: 2,
          title_native: "Au-dela des vignes",
          title_ru: "За пределами виноградников",
          summary: "Письмо разрывает привычный маршрут.",
          reading_minutes: 11,
          published_at: null,
          country: {
            id: "00000000-0000-0000-0000-000000000021",
            slug: "ausonia",
            url: "/atlas/ausonia",
            type: "country",
            title_ru: "Авзония",
            summary: "Виноградные долины и строгие дома.",
            avatar_asset_path: null,
            flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
          }
        }
      ]
    });
  });

  it("renders profile silhouette with biography, rumors and linked episode list", async () => {
    const view = renderCharacterDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Форсиль Виллет" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("character-detail-page")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Флаг страны: Авзония" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Domaine des Immortelles" })[0]).toHaveAttribute(
      "href",
      "/atlas/domaine-des-immortelles"
    );
    expect(screen.queryByText("Принадлежность:")).not.toBeInTheDocument();

    const params = screen.getByTestId("character-detail-params");
    expect(params).toHaveTextContent("20 лет");
    expect(params).toHaveTextContent("155см");
    expect(params).toHaveTextContent("ESTJ");
    expect(params).not.toHaveTextContent("Раса");
    expect(params).not.toHaveTextContent("MBTI");

    expect(screen.getByRole("heading", { name: "Биография" })).toBeInTheDocument();
    expect(screen.getByText("Сенешаль, которая держит дом в ритме и тишине.")).toBeInTheDocument();
    expect(screen.getAllByText("Форсиль Виллет")).toHaveLength(1);
    expect(screen.getByText("«Не всякую мягкость видно сразу.»")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Фраза персонажа" })).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Что говорят другие?" })).toBeInTheDocument();
    expect(screen.getByText("С ней сложно спорить о цене, потому что она уже всё просчитала.")).toBeInTheDocument();

    const episodeItems = screen.getAllByTestId("character-detail-episode-item");
    expect(episodeItems).toHaveLength(1);
    expect(episodeItems[0]).toHaveAttribute("href", "/episodes/za-predelami-vinogradnikov");
    expect(screen.getByText("Au-dela des vignes")).toBeInTheDocument();
    expect(screen.getByText("11 мин")).toBeInTheDocument();

    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(3);
    expect(view.container.querySelector(".section-break-stars")).toBeInTheDocument();
  });
});
