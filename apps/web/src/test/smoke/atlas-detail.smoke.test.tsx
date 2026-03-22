import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AtlasDetailPage from "@/pages/AtlasDetailPage";

const { getAtlasEntryMock } = vi.hoisted(() => ({
  getAtlasEntryMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getAtlasEntry: getAtlasEntryMock
}));

function renderAtlasDetailPage(initialEntry = "/atlas/abbaye-des-hautes-roches") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/atlas/:slug" element={<AtlasDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AtlasDetailPage smoke", () => {
  beforeEach(() => {
    getAtlasEntryMock.mockReset();
  });

  it("renders atlas detail with section facts, quotes and grouped relations", async () => {
    getAtlasEntryMock.mockResolvedValue({
      entity: {
        id: "00000000-0000-0000-0000-000000000301",
        slug: "abbaye-des-hautes-roches",
        url: "/atlas/abbaye-des-hautes-roches",
        type: "organization",
        title_ru: "Abbaye des Hautes Roches",
        summary: "Женская обитель внутренней Авзонии с собственным ритмом жизни.",
        overview_markdown:
          "# Abbaye des Hautes Roches\n\nУтро здесь начинается с колокола, списков и общего труда.\n\nОбитель держится на повторяемости, труде и строгом распорядке.",
        avatar_asset_path: null,
        flag_colors: null,
        published_at: "2026-03-15T00:00:00.000Z",
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
        location: {
          id: "00000000-0000-0000-0000-000000000041",
          slug: "skala-nad-roshami",
          url: "/atlas/skala-nad-roshami",
          type: "location",
          title_ru: "Скала над Рошами",
          summary: "Известковый выступ над дорогой.",
          avatar_asset_path: null,
          flag_colors: null
        }
      },
      sections: [
        {
          section: "social",
          title_ru: "Социальное",
          summary: "Режим, труд и повторяемость.",
          body_markdown: "Здесь любое движение становится частью распорядка.",
          fact: {
            title: "Тихий ритм лестниц",
            text: "Даже короткий путь внутри обители считается частью общего распорядка.",
            meta: "Это замечают даже паломницы на второй день"
          },
          quotes: [
            {
              id: 1,
              speaker_type: "character",
              speaker_name: "Элоди Лавери",
              speaker_meta: null,
              text: "Обитель держится не на тишине, а на повторяемости.",
              sort_order: 0,
              character: {
                id: "00000000-0000-0000-0000-000000000101",
                slug: "elodie-laverie",
                url: "/characters/elodie-laverie",
                name_ru: "Элоди Лавери",
                avatar_asset_path: "/assets/images/characters/elodie-laverie.png"
              }
            },
            {
              id: 2,
              speaker_type: "world",
              speaker_name: "Паломница из равнин",
              speaker_meta: "гостья на три дня",
              text: "Снаружи это место кажется суровым, но внутри оно учит дышать медленнее.",
              sort_order: 1,
              character: null
            }
          ]
        }
      ],
      relations: [
        {
          from_type: "atlas_entity",
          from_id: "00000000-0000-0000-0000-000000000301",
          to_type: "character",
          to_id: "00000000-0000-0000-0000-000000000101",
          label: "Элоди Лавери",
          target: {
            type: "character",
            id: "00000000-0000-0000-0000-000000000101",
            slug: "elodie-laverie",
            url: "/characters/elodie-laverie",
            title: "Элоди Лавери",
            avatar_asset_path: "/assets/images/characters/elodie-laverie.png",
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
        },
        {
          from_type: "atlas_entity",
          from_id: "00000000-0000-0000-0000-000000000301",
          to_type: "atlas_entity",
          to_id: "00000000-0000-0000-0000-000000000041",
          label: "Скала над Рошами",
          target: {
            type: "atlas_entity",
            id: "00000000-0000-0000-0000-000000000041",
            slug: "skala-nad-roshami",
            url: "/atlas/skala-nad-roshami",
            title: "Скала над Рошами",
            avatar_asset_path: null,
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
        }
      ]
    });

    const view = renderAtlasDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Abbaye des Hautes Roches", level: 1 })).toBeInTheDocument();
    });

    expect(screen.getByTestId("atlas-detail-page")).toBeInTheDocument();
    expect(screen.getByText("Женская обитель внутренней Авзонии с собственным ритмом жизни.")).toBeInTheDocument();
    expect(screen.getByText("Утро здесь начинается с колокола, списков и общего труда.")).toBeInTheDocument();
    expect(screen.getByText("Обитель держится на повторяемости, труде и строгом распорядке.")).toBeInTheDocument();

    const quotes = screen.getByTestId("atlas-detail-quotes");
    expect(within(quotes).getByText("Элоди Лавери")).toBeInTheDocument();
    expect(within(quotes).getByText("Паломница из равнин")).toBeInTheDocument();
    expect(within(quotes).getByRole("link", { name: "Элоди Лавери" })).toHaveAttribute(
      "href",
      "/characters/elodie-laverie"
    );

    const relations = screen.getByTestId("atlas-detail-relations");
    expect(within(relations).getByRole("heading", { name: "Персонажи" })).toBeInTheDocument();
    expect(within(relations).getByRole("heading", { name: "Мир" })).toBeInTheDocument();
    expect(within(relations).getAllByText("Скала над Рошами").length).toBeGreaterThan(0);

    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(1);
    expect(view.container.querySelectorAll(".section-break-stars")).toHaveLength(1);
  });

  it("renders location entries without quotes when section has none", async () => {
    getAtlasEntryMock.mockResolvedValue({
      entity: {
        id: "00000000-0000-0000-0000-000000000041",
        slug: "skala-nad-roshami",
        url: "/atlas/skala-nad-roshami",
        type: "location",
        title_ru: "Скала над Рошами",
        summary: "Известковый выступ над дорогой и монастырскими тропами.",
        overview_markdown: "# Скала над Рошами\n\nТекст локации.",
        avatar_asset_path: null,
        flag_colors: null,
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
        },
        location: null
      },
      sections: [
        {
          section: "geography",
          title_ru: "География",
          summary: null,
          body_markdown: null,
          fact: {
            title: "Пыль на манжетах",
            text: "После сухой недели тонкая светлая пыль ложится даже на рукава тех, кто просто вышел за хлебом.",
            meta: "Примета континентальной части"
          },
          quotes: []
        }
      ],
      relations: []
    });

    renderAtlasDetailPage("/atlas/skala-nad-roshami");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Скала над Рошами", level: 1 })).toBeInTheDocument();
    });

    expect(screen.queryByTestId("atlas-detail-quotes")).not.toBeInTheDocument();
    expect(screen.getByText("Пыль на манжетах")).toBeInTheDocument();
    expect(screen.getByText("Текст локации.")).toBeInTheDocument();
  });
});
