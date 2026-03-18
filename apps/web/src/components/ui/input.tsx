import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  appearance?: "default" | "ghost";
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, appearance = "default", ...props }, ref) => {
    const appearanceClassName =
      appearance === "ghost"
        ? "role-ui w-full border-none bg-transparent px-0 py-0 text-text placeholder:text-muted outline-none"
        : "role-ui flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

    return (
      <input
        type={type}
        className={cn(appearanceClassName, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
