import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BackToTopAnchor from "@/components/layout/BackToTopAnchor";

describe("BackToTopAnchor", () => {
  it("appears after scroll and sends the page to top", async () => {
    let scrollValue = 0;

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollValue
    });

    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(<BackToTopAnchor />);

    expect(screen.queryByTestId("back-to-top-anchor")).not.toBeInTheDocument();

    await act(async () => {
      scrollValue = 480;
      window.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("back-to-top-anchor")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("back-to-top-anchor"));

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth"
    });

    scrollToSpy.mockRestore();
  });
});
