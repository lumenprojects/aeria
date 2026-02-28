import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

export function ButtonGroup({
  value,
  onValueChange,
  options,
  className
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next)}
      className={cn("inline-flex gap-2", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
