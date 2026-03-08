import * as React from "react";
import { Separator } from "./separator";
import { cn } from "@/lib/utils";

export type SectionBreakVariant = "line" | "stars";

export type SectionBreakProps = {
  variant?: SectionBreakVariant;
  className?: string;
  lineWidthClassName?: string;
};

const starSpinConfig = [
  { baseAngle: 0, direction: 1 },
  { baseAngle: 22, direction: -1 },
  { baseAngle: -18, direction: 1 }
] as const;

export function SectionBreak({ variant = "line", className, lineWidthClassName }: SectionBreakProps) {
  const [scrollY, setScrollY] = React.useState(() => (typeof window === "undefined" ? 0 : window.scrollY));

  React.useEffect(() => {
    if (variant !== "stars") return;

    let frameId = 0;
    const syncScroll = () => {
      frameId = 0;
      setScrollY(window.scrollY);
    };

    const onScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(syncScroll);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [variant]);

  if (variant === "line") {
    return (
      <div className={cn("section-break", className)}>
        <Separator className={cn("section-break-line", lineWidthClassName)} />
      </div>
    );
  }

  return (
    <div className={cn("section-break section-break-stars", className)} aria-hidden="true">
      <div className="section-break-stars-cluster">
        {starSpinConfig.map((star, index) => (
          <span
            key={`section-break-star-${index}`}
            data-testid={`section-break-star-${index + 1}`}
            className={cn("section-break-star", `section-break-star-${index + 1}`)}
            style={{
              transform: `rotate(${star.baseAngle + scrollY * star.direction * 0.14}deg)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
