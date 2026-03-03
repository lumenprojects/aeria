import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "ui" | "muted" | "lead";

const variants: Record<TypographyVariant, string> = {
  h1: "text-heading text-h1",
  h2: "text-heading text-h2",
  h3: "text-heading text-h3",
  h4: "text-heading text-h4",
  body: "text-body",
  ui: "text-ui text-sm",
  muted: "text-body text-secondary",
  lead: "text-body text-h3"
};

export function Typography({
  variant = "body",
  className,
  as: Comp = "p",
  ...props
}: React.HTMLAttributes<HTMLElement> & { variant?: TypographyVariant; as?: any }) {
  return <Comp className={cn(variants[variant], className)} {...props} />;
}
