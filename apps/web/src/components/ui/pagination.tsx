import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Pagination({
  className,
  page,
  totalPages,
  onPageChange
}: {
  className?: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))}>
        Назад
      </Button>
      <span className="role-ui text-sm">
        {page} / {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
        Вперед
      </Button>
    </div>
  );
}
