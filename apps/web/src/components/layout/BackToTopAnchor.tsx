import React from "react";

const VISIBILITY_THRESHOLD = 320;

export default function BackToTopAnchor() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > VISIBILITY_THRESHOLD);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const handleClick = React.useCallback(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="navbar-icon ui-underline-click back-to-top-anchor"
      onClick={handleClick}
      aria-label="Наверх"
      data-testid="back-to-top-anchor"
    >
      <span className="back-to-top-anchor-icon" aria-hidden="true" />
    </button>
  );
}
