import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "ui" | "muted" | "lead";
type TypographyFontRole = "heading" | "body" | "ui";

const variantClasses: Record<TypographyVariant, string> = {
  h1: "type-h1",
  h2: "type-h2",
  h3: "type-h3",
  h4: "type-h4",
  body: "",
  ui: "",
  muted: "tone-secondary",
  lead: "type-h3"
};

const fontRoleClasses: Record<TypographyFontRole, string> = {
  heading: "role-heading",
  body: "role-body",
  ui: "role-ui"
};

const defaultFontRoleByVariant: Record<TypographyVariant, TypographyFontRole> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  body: "body",
  ui: "ui",
  muted: "body",
  lead: "body"
};

const variantStyles: Record<TypographyVariant, React.CSSProperties> = {
  h1: { fontSize: "var(--type-extra)", lineHeight: "var(--lh-heading)" },
  h2: { fontSize: "var(--type-medium)", lineHeight: "var(--lh-heading)" },
  h3: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-heading)" },
  h4: { fontSize: "var(--type-small)", lineHeight: "var(--lh-heading)" },
  body: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-body)" },
  ui: { fontSize: "var(--type-ui)", lineHeight: "var(--lh-ui)" },
  muted: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-body)" },
  lead: { fontSize: "var(--type-normal)", lineHeight: "var(--lh-body)" }
};

export function Typography({
  variant = "body",
  fontRole,
  className,
  as: Comp = "p",
  style,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  variant?: TypographyVariant;
  fontRole?: TypographyFontRole;
  as?: React.ElementType;
}) {
  const resolvedFontRole = fontRole ?? defaultFontRoleByVariant[variant];

  return (
    <Comp
      className={cn(fontRoleClasses[resolvedFontRole], variantClasses[variant], className)}
      style={{ ...variantStyles[variant], ...style }}
      {...props}
    />
  );
}
