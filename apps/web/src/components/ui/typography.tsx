import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "ui" | "muted" | "lead";

const variants: Record<TypographyVariant, string> = {
  h1: "text-heading text-4xl md:text-5xl",
  h2: "text-heading text-3xl md:text-4xl",
  h3: "text-heading text-2xl md:text-3xl",
  h4: "text-heading text-xl md:text-2xl",
  body: "text-body",
  ui: "text-ui text-sm",
  muted: "text-body text-muted",
  lead: "text-body text-xl"
};

export function Typography({
  variant = "body",
  className,
  as: Comp = "p",
  ...props
}: React.HTMLAttributes<HTMLElement> & { variant?: TypographyVariant; as?: any }) {
  return <Comp className={cn(variants[variant], className)} {...props} />;
}
