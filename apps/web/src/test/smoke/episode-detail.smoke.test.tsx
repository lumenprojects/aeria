import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EpisodeDetailPage from "@/pages/EpisodeDetailPage";

vi.mock("@/lib/api", () => ({
  getEpisode: vi.fn().mockResolvedValue({
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
      content_markdown: "Арно вошёл в дом и сразу понял, что назад дороги уже нет.",
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
  })
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
  it("renders centered chapter reader layout with titles, flag, participants and body", async () => {
    const view = renderEpisodeDetailPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Au-dela des vignes" })).toBeInTheDocument();
    });

    expect(screen.getByText("За пределами виноградников")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Флаг страны: Авзония" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Арно Дюмонт" })).toHaveAttribute("href", "/characters/arnaud-dumont");
    expect(screen.getByRole("link", { name: "Форсиль Виллет" })).toHaveAttribute("href", "/characters/forsil-villet");
    expect(screen.getByText(/Арно вошёл в дом/)).toBeInTheDocument();
    expect(screen.queryByText("Этот текст не должен появиться на странице.")).not.toBeInTheDocument();
    expect(view.container.querySelectorAll(".section-break-line")).toHaveLength(2);
  });
});
