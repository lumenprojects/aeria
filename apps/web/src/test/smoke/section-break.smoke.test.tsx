import { render, waitFor } from "@testing-library/react";
import { SectionBreak } from "@/components/ui";

describe("SectionBreak", () => {
  it("renders line variant as a separator", () => {
    const { container } = render(<SectionBreak variant="line" lineWidthClassName="width-medium" />);

    expect(container.querySelectorAll(".section-break-line")).toHaveLength(1);
    expect(container.querySelectorAll(".section-break-star")).toHaveLength(0);
  });

  it("renders stars variant and updates rotation on scroll", async () => {
    let scrollValue = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollValue
    });

    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        return window.setTimeout(() => callback(performance.now()), 0);
      });
    const cancelSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id: number) => window.clearTimeout(id));

    const { container } = render(<SectionBreak variant="stars" />);
    const stars = container.querySelectorAll<HTMLElement>(".section-break-star");

    expect(stars).toHaveLength(3);
    const initialTransform = stars[0].style.transform;

    scrollValue = 280;
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(stars[0].style.transform).not.toBe(initialTransform);
    });

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});
