import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { EntityAvatar } from "@/components/entities/entity-avatar";
import { Flag } from "@/components/entities/flag";

describe("Avatar primitive", () => {
  it("applies token-based size variants", () => {
    render(<Avatar size="xs" data-testid="avatar-xs" />);
    expect(screen.getByTestId("avatar-xs")).toHaveClass("h-[var(--avatar-xs)]");
    expect(screen.getByTestId("avatar-xs")).toHaveClass("w-[var(--avatar-xs)]");
  });
});

describe("EntityAvatar", () => {
  it("renders a link to the related entity route", () => {
    render(
      <MemoryRouter>
        <EntityAvatar
          entityType="character"
          entitySlug="character-001"
          imageSrc="/assets/images/characters/character-001.png"
          label="Персонаж 001"
          size="lg"
        />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "Персонаж 001" });
    expect(link).toHaveAttribute("href", "/characters/character-001");
  });
});

describe("Flag", () => {
  it("renders one segment per color and stays non-interactive", () => {
    render(
      <Flag
        country={{
          id: "00000000-0000-0000-0000-000000000001",
          slug: "ru-example",
          title_ru: "Примерная страна",
          flag_colors: ["#ffffff", "#0057b7", "#d52b1e"]
        }}
        size="md"
      />
    );

    expect(screen.getAllByTestId("flag-segment")).toHaveLength(3);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveClass("theme-stroke");
  });

  it("supports the full size scale including xl", () => {
    render(
      <Flag
        country={{
          id: "00000000-0000-0000-0000-000000000001",
          slug: "ru-example",
          title_ru: "ÐŸÑ€Ð¸Ð¼ÐµÑ€Ð½Ð°Ñ ÑÑ‚Ñ€Ð°Ð½Ð°",
          flag_colors: ["#ffffff", "#0057b7", "#d52b1e"]
        }}
        size="xl"
      />
    );

    expect(screen.getByRole("img")).toHaveClass("w-[var(--flag-w-xl)]");
    expect(screen.getByRole("img")).toHaveClass("h-[var(--flag-h-xl)]");
  });

  it("returns null when country or colors are missing", () => {
    const { container, rerender } = render(<Flag country={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(
      <Flag
        country={{
          id: "00000000-0000-0000-0000-000000000001",
          slug: "ru-example",
          title_ru: "Примерная страна",
          flag_colors: []
        }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
