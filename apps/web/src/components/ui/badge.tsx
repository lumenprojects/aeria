import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "role-ui inline-flex items-center rounded-full border border-border px-2.5 py-0.5 font-medium",
  {
    variants: {
      variant: {
        default: "bg-surface text-text",
        outline: "text-text",
        accent: "bg-accent text-[var(--accent-contrast)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
