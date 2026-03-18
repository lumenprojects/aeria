import { Typography } from "./typography";

export type AppliedFilterItem = {
  key: string;
  label: string;
  value: string;
  onClear?: () => void;
};

type AppliedFiltersBarProps = {
  items: AppliedFilterItem[];
  onClearAll?: () => void;
  className?: string;
};

export function AppliedFiltersBar({ items, onClearAll, className }: AppliedFiltersBarProps) {
  if (items.length === 0) return null;

  return (
    <div className={["applied-filters-bar", className].filter(Boolean).join(" ")}>
      <Typography variant="ui" as="p" className="tone-tertiary applied-filters-bar-label">
        Активно
      </Typography>

      <div className="applied-filters-bar-items">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="applied-filters-bar-chip ui-underline-hover"
            onClick={item.onClear}
            disabled={!item.onClear}
          >
            <span className="applied-filters-bar-chip-label">{item.label}</span>
            <span className="applied-filters-bar-chip-value">{item.value}</span>
          </button>
        ))}
      </div>

      {onClearAll ? (
        <button type="button" className="applied-filters-bar-clear tone-secondary ui-underline-hover" onClick={onClearAll}>
          Сбросить все
        </button>
      ) : null}
    </div>
  );
}
