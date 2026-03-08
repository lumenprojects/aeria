import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CountryMediaCarousel } from "@/components/home/CountryMediaCarousel";

describe("CountryMediaCarousel smoke", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("switches slides on dot click", async () => {
    render(<CountryMediaCarousel />);
    const tabs = screen.getAllByRole("tab");

    await waitFor(() => {
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    fireEvent.click(tabs[3]);

    await waitFor(() => {
      expect(tabs[3]).toHaveAttribute("aria-selected", "true");
      expect(tabs[3]).toHaveClass("home-country-carousel-dot-active");
    });
  });

  it("autoplays every 7s and pauses on hover, focus and drag", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    render(<CountryMediaCarousel />);
    const section = screen.getByTestId("home-country-carousel");

    const getTabs = () => screen.getAllByRole("tab");
    const getActiveIndex = () => getTabs().findIndex((tab) => tab.getAttribute("aria-selected") === "true");

    await waitFor(() => {
      expect(getActiveIndex()).toBe(0);
    });

    const activeAfterMount = getActiveIndex();
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    await waitFor(() => {
      expect(getActiveIndex()).not.toBe(activeAfterMount);
    });

    const activeBeforeHover = getActiveIndex();
    fireEvent.mouseEnter(section);
    act(() => {
      vi.advanceTimersByTime(14000);
    });
    expect(getActiveIndex()).toBe(activeBeforeHover);

    fireEvent.mouseLeave(section);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    await waitFor(() => {
      expect(getActiveIndex()).not.toBe(activeBeforeHover);
    });

    const activeBeforeFocus = getActiveIndex();
    const activeTabBeforeFocus = getTabs()[activeBeforeFocus];
    fireEvent.focus(activeTabBeforeFocus);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(getActiveIndex()).toBe(activeBeforeFocus);

    fireEvent.blur(activeTabBeforeFocus);
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    await waitFor(() => {
      expect(getActiveIndex()).not.toBe(activeBeforeFocus);
    });

    const activeBeforeDrag = getActiveIndex();
    fireEvent.pointerDown(section, { button: 0, pointerId: 1, clientX: 50 });
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(getActiveIndex()).toBe(activeBeforeDrag);

    fireEvent.pointerUp(section, { pointerId: 1, clientX: 50 });
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    await waitFor(() => {
      expect(getActiveIndex()).not.toBe(activeBeforeDrag);
    });

  });
});
