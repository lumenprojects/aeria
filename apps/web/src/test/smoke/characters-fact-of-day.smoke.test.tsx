import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CharactersPage from "@/pages/CharactersPage";

const { getCharactersMock, getCharacterFactOfDayMock } = vi.hoisted(() => ({
  getCharactersMock: vi.fn(),
  getCharacterFactOfDayMock: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getCharacters: getCharactersMock,
  getCharacterFactOfDay: getCharacterFactOfDayMock
}));

function renderCharactersPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CharactersPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CharactersPage fact of day smoke", () => {
  beforeEach(() => {
    getCharactersMock.mockReset();
    getCharacterFactOfDayMock.mockReset();
  });

  it("renders fact of day section with author avatar link", async () => {
    getCharactersMock.mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          tagline: "Кондитер-экспериментатор"
        }
      ]
    });
    getCharacterFactOfDayMock.mockResolvedValue({
      id: 11,
      fact_text: "Лилетт однажды попыталась приготовить настоящий шоколатин.",
      comment_text: "Я до сих пор не понимаю, почему она добавила туда ром.",
      subject_character: {
        id: "00000000-0000-0000-0000-000000000031",
        slug: "character-001",
        url: "/characters/character-001",
        name_ru: "Лилетт",
        avatar_asset_path: "/assets/images/characters/character-001.png"
      },
      comment_author_character: {
        id: "00000000-0000-0000-0000-000000000032",
        slug: "character-002",
        url: "/characters/character-002",
        name_ru: "Арно",
        avatar_asset_path: "/assets/images/characters/character-002.png"
      }
    });

    renderCharactersPage();

    await waitFor(() => {
      expect(screen.queryByTestId("characters-fact-skeleton")).not.toBeInTheDocument();
    });

    const factSection = screen.getByTestId("characters-fact");

    expect(factSection).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Рубрика! Факт дня" })).toBeInTheDocument();
    expect(screen.getByText("Сегодня у нас..")).toBeInTheDocument();
    expect(screen.getByText("Лилетт однажды попыталась приготовить настоящий шоколатин.")).toBeInTheDocument();
    expect(screen.getByText("Я до сих пор не понимаю, почему она добавила туда ром.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Открыть персонажа Лилетт" })).toHaveAttribute(
      "href",
      "/characters/character-001"
    );
    expect(screen.getByRole("link", { name: "Открыть персонажа Арно" })).toHaveAttribute(
      "href",
      "/characters/character-002"
    );
  });

  it("renders comment without avatar when fact comment author is null", async () => {
    getCharactersMock.mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          tagline: null
        }
      ]
    });
    getCharacterFactOfDayMock.mockResolvedValue({
      id: 12,
      fact_text: "Лилетт прячет лаванду во всех блокнотах.",
      comment_text: "Это была не моя идея.",
      subject_character: {
        id: "00000000-0000-0000-0000-000000000031",
        slug: "character-001",
        url: "/characters/character-001",
        name_ru: "Лилетт",
        avatar_asset_path: "/assets/images/characters/character-001.png"
      },
      comment_author_character: null
    });

    const view = renderCharactersPage();

    await waitFor(() => {
      expect(screen.getByText("Лилетт прячет лаванду во всех блокнотах.")).toBeInTheDocument();
    });

    expect(screen.getByText("Это была не моя идея.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Открыть персонажа Арно" })).not.toBeInTheDocument();
    expect(view.container.querySelector(".characters-fact-comment-avatar-link")).not.toBeInTheDocument();
  });

  it("keeps persistent skeleton when fact of day is null and still renders character list", async () => {
    getCharactersMock.mockResolvedValue({
      items: [
        {
          id: "00000000-0000-0000-0000-000000000031",
          slug: "character-001",
          url: "/characters/character-001",
          name_ru: "Лилетт",
          tagline: "Кондитер-экспериментатор"
        },
        {
          id: "00000000-0000-0000-0000-000000000032",
          slug: "character-002",
          url: "/characters/character-002",
          name_ru: "Арно",
          tagline: null
        }
      ]
    });
    getCharacterFactOfDayMock.mockResolvedValue(null);

    renderCharactersPage();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Лилетт Кондитер-экспериментатор" })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Арно" })).toBeInTheDocument();
    expect(screen.getByTestId("characters-fact-skeleton")).toBeInTheDocument();
  });
});
