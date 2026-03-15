import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EpisodeDetailPage from "@/pages/EpisodeDetailPage";

const { getEpisodeMock, getCharacterPreviewMock, getAtlasPreviewMock } = vi.hoisted(() => ({
  getEpisodeMock: vi.fn(),
  getCharacterPreviewMock: vi.fn(),
  getAtlasPreviewMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getEpisode: getEpisodeMock,
  getCharacterPreview: getCharacterPreviewMock,
  getAtlasPreview: getAtlasPreviewMock
}));

function renderEpisodeDetailPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/episodes/za-predelami-vinogradnikov"]}>
        <Routes>
          <Route path="/episodes/:slug" element={<EpisodeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("EpisodeDetailPage smoke", () => {
  beforeEach(() => {
    getEpisodeMock.mockReset();
    getCharacterPreviewMock.mockReset();
    getAtlasPreviewMock.mockReset();

    getEpisodeMock.mockResolvedValue({
      episode: {
        id: "00000000-0000-0000-0000-000000000001",
        slug: "za-predelami-vinogradnikov",
        url: "/episodes/za-predelami-vinogradnikov",
        series_id: "00000000-0000-0000-0000-000000000011",
        country_id: "00000000-0000-0000-0000-000000000021",
        episode_number: 1,
        global_order: 6,
        title_native: "Au-dela des vignes",
        title_ru: "За пределами виноградников",
        summary: "Этот текст не должен появиться на странице.",
        content_markdown:
          "### Письмо\n\nАрно встретил [Форсиль Виллет](/characters/forsil-villet).\n\n---\n\n### После полудня\n\nОн вспомнил [Бастида де ла Люн д'Ор](/atlas/domaine-des-immortelles).",
        reading_minutes: 11,
        published_at: null
      },
      series: {
        id: "00000000-0000-0000-0000-000000000011",
        slug: "yellow-moon",
        url: "/episodes?series=yellow-moon",
        title_ru: "Жёлтая Луна",
        brand_color: "#FFBF36",
        summary: null
      },
      country: {
        id: "00000000-0000-0000-0000-000000000021",
        slug: "ausonia",
        url: "/atlas/ausonia",
        title_ru: "Авзония",
        flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
      },
      characters: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "arnaud-dumont",
          url: "/characters/arnaud-dumont",
          name_ru: "Арно Дюмонт",
          name_native: "Arnaud Dumont",
          tagline: "Порядок не спасает от перемен.",
          avatar_asset_path: "/assets/images/characters/arnaud-dumont.png"
        },
        {
          id: "00000000-0000-0000-0000-000000000032",
          slug: "forsil-villet",
          url: "/characters/forsil-villet",
          name_ru: "Форсиль Виллет",
          name_native: "Forsil Villet",
          tagline: "Дом держится на её ритме.",
          avatar_asset_path: "/assets/images/characters/forsil-villet.png"
        }
      ],
      locations: []
    });

    getCharacterPreviewMock.mockResolvedValue({
      slug: "forsil-villet",
      url: "/characters/forsil-villet",
      name_ru: "Форсиль Виллет",
      name_native: "Forsil Villet",
      avatar_asset_path: "/assets/images/characters/forsil-villet.png",
      tagline: "Дом держится на её ритме.",
      country: null,
      affiliation: null
    });

    getAtlasPreviewMock.mockResolvedValue({
      slug: "domaine-des-immortelles",
      url: "/atlas/domaine-des-immortelles",
      kind: "geography",
      title_ru: "Бастида де ла Люн д'Ор",
      summary: "Поместье, где Арно начинает новую жизнь.",
      avatar_asset_path: null,
      country: null
    });
  });

  it("renders centered chapter reader layout with titles, flag, participants and body", async () => {
    const view = renderEpisodeDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Au-dela des vignes" })).toBeInTheDocument();
    });

    expect(screen.getByText("За пределами виноградников")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Флаг страны: Авзония" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Арно Дюмонт" })).toHaveAttribute("href", "/characters/arnaud-dumont");
    expect(screen.getByText("Форсиль Виллет", { selector: "a.inline-entity-reference" })).toHaveAttribute(
      "href",
      "/characters/forsil-villet"
    );
    expect(screen.getByText("Письмо")).toBeInTheDocument();
    expect(screen.getByText("После полудня")).toBeInTheDocument();
    expect(screen.queryByText("Этот текст не должен появиться на странице.")).not.toBeInTheDocument();
    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(2);
    expect(view.container.querySelector(".markdown-divider-reading")).toBeInTheDocument();
  });

  it("shows compact hover previews for internal character and atlas links inside reading markdown", async () => {
    renderEpisodeDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Au-dela des vignes" })).toBeInTheDocument();
    });

    const characterLink = screen.getByText("Форсиль Виллет", { selector: "a.inline-entity-reference" });
    fireEvent.focus(characterLink);

    await waitFor(() => {
      expect(screen.getByText("Дом держится на её ритме.")).toBeInTheDocument();
    });
    expect(getCharacterPreviewMock).toHaveBeenCalledWith("forsil-villet");

    const atlasLink = screen.getByRole("link", { name: "Бастида де ла Люн д'Ор" });
    fireEvent.focus(atlasLink);

    await waitFor(() => {
      expect(screen.getByText("Поместье, где Арно начинает новую жизнь.")).toBeInTheDocument();
    });
    expect(getAtlasPreviewMock).toHaveBeenCalledWith("domaine-des-immortelles");
  });
});
