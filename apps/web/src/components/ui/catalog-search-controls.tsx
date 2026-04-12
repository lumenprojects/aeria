import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

type CatalogSearchControlsProps = {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  isUnderlineActive?: boolean;
  filterButtonLabel: string;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  filterButtonTestId?: string;
  inputTestId?: string;
};

export function CatalogSearchControls({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  isUnderlineActive = false,
  filterButtonLabel,
  isFiltersOpen,
  onToggleFilters,
  filterButtonTestId,
  inputTestId
}: CatalogSearchControlsProps) {
  return (
    <div className="catalog-search-controls">
      <label className="catalog-search-shell" aria-label={searchLabel}>
        <Search size={18} className="catalog-search-icon" aria-hidden="true" />
        <Input
          appearance="ghost"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          placeholder={searchPlaceholder}
          data-testid={inputTestId}
          className={cn(
            "catalog-search-input role-ui interactive-input-underline",
            isUnderlineActive && "interactive-input-underline-active"
          )}
        />
      </label>

      <button
        type="button"
        aria-label={filterButtonLabel}
        aria-expanded={isFiltersOpen}
        className={cn(
          "icon-button catalog-filter-button ui-underline-click",
          isFiltersOpen && "icon-button-active ui-underline-active"
        )}
        onClick={onToggleFilters}
        data-testid={filterButtonTestId}
      >
        <SlidersHorizontal size={18} />
      </button>
    </div>
  );
}
