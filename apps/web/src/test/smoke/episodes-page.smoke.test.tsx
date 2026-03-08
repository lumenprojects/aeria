import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EpisodesPage from "@/pages/EpisodesPage";
import { getEpisodes } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getEpisodes: vi.fn()
}));

const getEpisodesMock = vi.mocked(getEpisodes);

function renderEpisodesPage(path = "/episodes") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <EpisodesPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("EpisodesPage smoke", () => {
  beforeEach(() => {
    getEpisodesMock.mockReset();
  });

  it("renders editorial intro and linear feed entries", async () => {
    getEpisodesMock.mockResolvedValue({
      items: [
        {
          id: "episode-1",
          slug: "episode-001",
          title_ru: "Эпизод 001",
          summary: "Первая пробная глава.",
          episode_number: 1,
          reading_minutes: 12,
          published_at: "2026-02-28T00:00:00.000Z",
          country: {
            title_ru: "Северные острова"
          }
        }
      ],
      total: 1,
      page: 1,
      limit: 20
    } as any);

    renderEpisodesPage();

    expect(screen.getByText("Ход истории")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Эпизоды" })).toHaveClass("sr-only");

    const entry = await screen.findByRole("link", { name: /Эпизод 001/i });
    expect(entry).not.toHaveClass("entity-link-block");
    expect(screen.getByText("Первая пробная глава.")).toBeInTheDocument();
    expect(screen.getByText("Северные острова")).toBeInTheDocument();
    expect(screen.getByText("12 мин")).toBeInTheDocument();
    expect(screen.getByText(/28 февраля 2026/)).toBeInTheDocument();
  });

  it("passes series filter from query params", async () => {
    getEpisodesMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20
    } as any);

    renderEpisodesPage("/episodes?series=series-01");

    await waitFor(() => {
      expect(getEpisodesMock).toHaveBeenCalledWith({ series: "series-01" });
    });
  });

  it("renders loading state as plain text", () => {
    getEpisodesMock.mockImplementation(() => new Promise(() => {}));

    renderEpisodesPage();

    expect(screen.getByText("Лента собирается. Еще мгновение.")).toBeInTheDocument();
  });

  it("renders empty state as plain text", async () => {
    getEpisodesMock.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20
    } as any);

    renderEpisodesPage();

    expect(await screen.findByText("Пока здесь тихо. Новые главы еще не появились.")).toBeInTheDocument();
  });

  it("renders error state as plain text", async () => {
    getEpisodesMock.mockRejectedValue(new Error("boom"));

    renderEpisodesPage();

    expect(await screen.findByText("Не удалось открыть ленту. Попробуйте еще раз чуть позже.")).toBeInTheDocument();
  });
});
