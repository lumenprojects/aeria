import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui";
import { atlasViewModeOptions, type AtlasCatalogViewMode } from "./atlas-catalog-data";

type AtlasCatalogViewSwitchProps = {
  value: AtlasCatalogViewMode;
  onChange: (value: AtlasCatalogViewMode) => void;
};

export function AtlasCatalogViewSwitch({ value, onChange }: AtlasCatalogViewSwitchProps) {
  return (
    <div className="atlas-catalog-view-switch" role="toolbar" aria-label="Режим обзора каталога">
      {atlasViewModeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "atlas-catalog-view-button ui-underline-click",
            value === option.value && "ui-underline-active tone-secondary"
          )}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <Typography variant="ui" as="span">
            {option.label}
          </Typography>
        </button>
      ))}
    </div>
  );
}
