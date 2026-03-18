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

  it("renders atlas detail with fact, quotes and grouped relations", async () => {
    getAtlasEntryMock.mockResolvedValue({
      node_type: "atlas_entry",
      entry: {
        id: "00000000-0000-0000-0000-000000000301",
        slug: "abbaye-des-hautes-roches",
        url: "/atlas/abbaye-des-hautes-roches",
        kind: "social",
        title_ru: "Abbaye des Hautes Roches",
        summary: "Женская обитель внутренней Авзонии с собственным ритмом жизни.",
        content_markdown:
          "# Abbaye des Hautes Roches\n\n## Распорядок\n\nУтро здесь начинается с колокола, списков и общего труда.\n\n## Обеты\n\nОбитель держится на повторяемости, труде и строгом распорядке.",
        avatar_asset_path: null,
        country_id: "00000000-0000-0000-0000-000000000021",
        location_id: "00000000-0000-0000-0000-000000000041",
        published_at: "2026-03-15T00:00:00.000Z"
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      location: {
        id: "00000000-0000-0000-0000-000000000041",
        slug: "skala-nad-roshami",
        url: "/atlas/skala-nad-roshami",
        title_ru: "Скала над Рошами",
        avatar_asset_path: null,
        country: {
          id: "00000000-0000-0000-0000-000000000021",
          slug: "ausonia",
          url: "/atlas/ausonia",
          title_ru: "Авзония",
          flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
        }
      },
      fact: {
        title: "Тихий ритм лестниц",
        text: "Даже короткий путь внутри обители здесь считается частью общего распорядка: шаг, пауза и поворот повторяются десятки раз в день.",
        meta: "Это замечают даже паломницы на второй день"
      },
      quotes: [
        {
          id: 1,
          speaker_type: "character",
          speaker_name: "Элоди Лавери",
          speaker_meta: null,
          text: "Обитель держится не на тишине, а на повторяемости: если убрать ритм, стены быстро перестанут помогать.",
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
          text: "Снаружи это место кажется суровым, но внутри оно учит дышать медленнее и не спорить с порядком каждую минуту.",
          sort_order: 1,
          character: null
        },
        {
          id: 3,
          speaker_type: "world",
          speaker_name: "Сестра Клеманс",
          speaker_meta: "старшая по трапезной",
          text: "Если на кухне тише обычного, значит, кто-то проспал первый колокол.",
          sort_order: 2,
          character: null
        }
      ],
      relations: [
        {
          from_type: "atlas_entry",
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
              title_ru: "Авзония",
              flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
            }
          }
        },
        {
          from_type: "atlas_entry",
          from_id: "00000000-0000-0000-0000-000000000301",
          to_type: "location",
          to_id: "00000000-0000-0000-0000-000000000041",
          label: "Скала над Рошами",
          target: {
            type: "location",
            id: "00000000-0000-0000-0000-000000000041",
            slug: "skala-nad-roshami",
            url: "/atlas/skala-nad-roshami",
            title: "Скала над Рошами",
            avatar_asset_path: null,
            country: {
              id: "00000000-0000-0000-0000-000000000021",
              slug: "ausonia",
              url: "/atlas/ausonia",
              title_ru: "Авзония",
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
    expect(screen.getAllByText("Запись атласа").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Социальное").length).toBeGreaterThan(0);
    expect(screen.getByText("Локация / Скала над Рошами")).toBeInTheDocument();
    expect(screen.getByText("Женская обитель внутренней Авзонии с собственным ритмом жизни.")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Флаг страны: Авзония" }).length).toBeGreaterThan(0);

    expect(screen.getByRole("heading", { name: "Запись" })).toBeInTheDocument();
    expect(screen.getByText("Утро здесь начинается с колокола, списков и общего труда.")).toBeInTheDocument();
    expect(screen.getByText("Обитель держится на повторяемости, труде и строгом распорядке.")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "В этой записи" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Распорядок" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Обеты" }).length).toBeGreaterThan(0);

    const fact = screen.getByTestId("atlas-detail-fact");
    expect(within(fact).getByRole("heading", { name: "Интересный факт" })).toBeInTheDocument();
    expect(within(fact).getByText("Тихий ритм лестниц")).toBeInTheDocument();
    expect(within(fact).getByText(/Даже короткий путь внутри обители/)).toBeInTheDocument();

    const quotes = screen.getByTestId("atlas-detail-quotes");
    expect(within(quotes).getByRole("heading", { name: "Что говорят" })).toBeInTheDocument();
    expect(within(quotes).getByText("Элоди Лавери")).toBeInTheDocument();
    expect(within(quotes).getByText("Паломница из равнин")).toBeInTheDocument();
    expect(within(quotes).getByText("старшая по трапезной")).toBeInTheDocument();
    expect(within(quotes).getByText(/Обитель держится не на тишине/)).toBeInTheDocument();
    expect(within(quotes).getByRole("link", { name: "Открыть персонажа Элоди Лавери" })).toHaveAttribute(
      "href",
      "/characters/elodie-laverie"
    );
    expect(within(quotes).getByRole("link", { name: "Элоди Лавери" })).toHaveAttribute(
      "href",
      "/characters/elodie-laverie"
    );

    const relations = screen.getByTestId("atlas-detail-relations");
    expect(within(relations).getByRole("heading", { name: "Связи" })).toBeInTheDocument();
    expect(within(relations).getByRole("heading", { name: "Персонажи" })).toBeInTheDocument();
    expect(within(relations).getByRole("heading", { name: "Локации" })).toBeInTheDocument();
    expect(within(relations).getAllByText("Элоди Лавери").length).toBeGreaterThan(0);
    expect(within(relations).getAllByText("Скала над Рошами").length).toBeGreaterThan(0);

    const relationLinks = within(relations).getAllByRole("link");
    expect(relationLinks.map((link) => link.getAttribute("href"))).toEqual(
      expect.arrayContaining(["/characters/elodie-laverie", "/atlas/skala-nad-roshami"])
    );

    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(1);
  });

  it("hides quotes for country nodes and switches fact heading to place mode", async () => {
    getAtlasEntryMock.mockResolvedValue({
      node_type: "country",
      entry: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        kind: "geography",
        title_ru: "Авзония",
        summary: null,
        content_markdown: "# Авзония\n\nТекст страны.",
        avatar_asset_path: null,
        country_id: "00000000-0000-0000-0000-000000000021",
        location_id: null,
        published_at: null
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
      },
      location: null,
      fact: {
        title: "Пыль на манжетах",
        text: "После сухой недели тонкая светлая пыль ложится даже на рукава тех, кто просто вышел за хлебом.",
        meta: "Примета континентальной части"
      },
      quotes: [],
      relations: []
    });

    renderAtlasDetailPage("/atlas/ausonia");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Авзония", level: 1 })).toBeInTheDocument();
    });

    expect(screen.queryByTestId("atlas-detail-quotes")).not.toBeInTheDocument();
    expect(screen.getByTestId("atlas-detail-fact")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Примета места" })).toBeInTheDocument();
  });
});
