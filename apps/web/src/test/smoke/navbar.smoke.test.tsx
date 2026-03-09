import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

vi.mock("@/lib/api", () => ({
  getEpisode: vi.fn(),
  getSeries: vi.fn(),
  searchAll: vi.fn().mockResolvedValue({ groups: [] })
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => ({
    theme: "paper",
    mode: "dark",
    fontHeading: "Playfair Display",
    fontBody: "Lora",
    fontUi: "IBM Plex Sans",
    noise: false,
    tapEffect: "none",
    setMode: vi.fn(),
    setTheme: vi.fn(),
    setFontHeading: vi.fn(),
    setFontBody: vi.fn(),
    setFontUi: vi.fn(),
    setNoise: vi.fn(),
    setTapEffect: vi.fn()
  })
}));

function renderNavbar(path = "/") {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Navbar smoke", () => {
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

  it("toggles inline search with keyboard", () => {
    renderNavbar("/");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByPlaceholderText("Поиск по главам, персонажам и миру...")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Поиск по главам, персонажам и миру...")).not.toBeInTheDocument();
  });

  it("opens fonts and settings popovers", () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: "Шрифты" }));
    expect(screen.getByText("UI")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Настройки" }));
    expect(screen.getByText("Style")).toBeInTheDocument();
  });
});
