import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "ui" | "muted" | "lead";

const variants: Record<TypographyVariant, string> = {
  h1: "role-heading type-h1",
  h2: "role-heading type-h2",
  h3: "role-heading type-h3",
  h4: "role-heading type-h4",
  body: "role-body",
  ui: "role-ui",
  muted: "role-body tone-secondary",
  lead: "role-body type-h3"
};

const variantStyles: Record<TypographyVariant, React.CSSProperties> = {
  h1: { fontSize: "var(--type-extra)", lineHeight: "var(--lh-heading)" },
  h2: { fontSize: "var(--type-medium)", lineHeight: "var(--lh-heading)" },
  h3: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-heading)" },
  h4: { fontSize: "var(--type-small)", lineHeight: "var(--lh-heading)" },
  body: { fontSize: "var(--type-small)", lineHeight: "var(--lh-body)" },
  ui: { fontSize: "var(--type-ui)", lineHeight: "var(--lh-ui)" },
  muted: { fontSize: "var(--type-small)", lineHeight: "var(--lh-body)" },
  lead: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-body)" }
};

export function Typography({
  variant = "body",
  className,
  as: Comp = "p",
  style,
  ...props
}: React.HTMLAttributes<HTMLElement> & { variant?: TypographyVariant; as?: React.ElementType }) {
  return <Comp className={cn(variants[variant], className)} style={{ ...variantStyles[variant], ...style }} {...props} />;
}
