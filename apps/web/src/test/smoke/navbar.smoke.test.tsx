import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const {
  getEpisodeMock,
  getSeriesMock,
  setModeMock,
  setThemeMock,
  setFontHeadingMock,
  setFontBodyMock,
  setFontUiMock,
  setTapEffectMock
} = vi.hoisted(() => ({
  getEpisodeMock: vi.fn(),
  getSeriesMock: vi.fn(),
  setModeMock: vi.fn(),
  setThemeMock: vi.fn(),
  setFontHeadingMock: vi.fn(),
  setFontBodyMock: vi.fn(),
  setFontUiMock: vi.fn(),
  setTapEffectMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getEpisode: getEpisodeMock,
  getSeries: getSeriesMock,
  searchAll: vi.fn().mockResolvedValue({ groups: [] })
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => ({
    theme: "paper",
    mode: "dark",
    fontHeading: "Playfair Display",
    fontBody: "Lora",
    fontUi: "IBM Plex Sans",
    tapEffect: "none",
    setMode: setModeMock,
    setTheme: setThemeMock,
    setFontHeading: setFontHeadingMock,
    setFontBody: setFontBodyMock,
    setFontUi: setFontUiMock,
    setTapEffect: setTapEffectMock
  })
}));

function renderNavbar(path = "/", routePath = "*") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={<Navbar />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Navbar smoke", () => {
  beforeEach(() => {
    getEpisodeMock.mockReset();
    getSeriesMock.mockReset();
    setModeMock.mockReset();
    setThemeMock.mockReset();
    setFontHeadingMock.mockReset();
    setFontBodyMock.mockReset();
    setFontUiMock.mockReset();
    setTapEffectMock.mockReset();

    getEpisodeMock.mockResolvedValue({
      episode: {
        episode_number: 1
      },
      series: {
        slug: "yellow-moon",
        title_ru: "Жёлтая Луна"
      }
    });

    getSeriesMock.mockResolvedValue({
      episodes: [{ id: "1" }, { id: "2" }, { id: "3" }]
    });
  });

  it("renders primary nav links", () => {
    const { container } = renderNavbar("/");
    expect(screen.getAllByRole("link", { name: "Главная" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Эпизоды" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Персонажи" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Атлас" }).length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".navbar-divider")).toHaveLength(1);
  });

  it("opens inline search by icon click without empty prompt", () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: "Поиск" }));
    const input = screen.getByPlaceholderText("Поиск по главам, персонажам и миру...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass("role-ui");
    expect(screen.queryByText("Введите запрос для поиска")).not.toBeInTheDocument();
  });

  it("toggles inline search with keyboard", async () => {
    renderNavbar("/");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByPlaceholderText("Поиск по главам, персонажам и миру...")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Поиск по главам, персонажам и миру...")).not.toBeInTheDocument();
    });
  });

  it("opens fonts and settings popovers", async () => {
    const { container } = renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: "Шрифты" }));
    expect(screen.getByText("UI")).toBeInTheDocument();
    expect(container.querySelectorAll("select")).toHaveLength(0);
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(3);

    fireEvent.click(screen.getByRole("button", { name: "Настройки" }));
    await waitFor(() => {
      expect(screen.getByText("Style")).toBeInTheDocument();
    });
    expect(container.querySelectorAll("select")).toHaveLength(0);

    fireEvent.click(screen.getByRole("combobox", { name: "Style" }));
    await waitFor(() => {
      expect(document.body.querySelectorAll(".navbar-theme-dot").length).toBeGreaterThanOrEqual(4);
    });
  });

  it("applies select option via radix select interactions", async () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: "Шрифты" }));

    const uiSelect = screen.getByRole("combobox", { name: "UI" });
    fireEvent.click(uiSelect);

    const option = await screen.findByRole("option", { name: "Manrope" });
    fireEvent.click(option);

    expect(setFontUiMock).toHaveBeenCalledWith("Manrope");
  });

  it("renders reading navbar with split dividers and symbol separators", async () => {
    const { container } = renderNavbar("/episodes/za-predelami-vinogradnikov", "/episodes/:slug");

    await waitFor(() => {
      expect(container.querySelector(".navbar-reading")).toHaveTextContent("1 / 3");
    });

    expect(container.querySelectorAll(".navbar-divider")).toHaveLength(3);
    expect(container.querySelector(".navbar-progress")).toBeInTheDocument();
    expect(container.querySelector(".navbar-progress-indicator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Назад" })).toHaveClass("navbar-icon", "navbar-back");
    expect(screen.queryByText("Назад")).not.toBeInTheDocument();
    expect(screen.getByText("<")).toBeInTheDocument();
    expect(screen.getByText(">")).toBeInTheDocument();
    expect(container.querySelector(".navbar-reading-total")).toHaveClass("tone-tertiary");
  });
});
