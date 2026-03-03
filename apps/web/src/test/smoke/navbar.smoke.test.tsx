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
    fontHeading: "Fraunces",
    fontBody: "Source Serif 4",
    fontUi: "Manrope",
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
    renderNavbar("/");
    expect(screen.getAllByRole("link", { name: "Главная" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Эпизоды" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Персонажи" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Атлас" }).length).toBeGreaterThan(0);
  });

  it("opens inline search by icon click", () => {
    renderNavbar("/");
    fireEvent.click(screen.getByRole("button", { name: "Поиск" }));
    expect(screen.getByPlaceholderText("Поиск по главам, персонажам и миру...")).toBeInTheDocument();
  });
});
