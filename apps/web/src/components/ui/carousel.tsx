import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

export function Carousel({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [emblaRef] = useEmblaCarousel({ loop: false });
  return (
    <div className={cn("overflow-hidden", className)} ref={emblaRef}>
      <div className="flex gap-4">{children}</div>
    </div>
  );
}

export function CarouselItem({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("min-w-0 flex-[0_0_80%]", className)}>{children}</div>;
}
