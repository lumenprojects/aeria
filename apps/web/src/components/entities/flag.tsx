type CountryFlag = {
  id: string;
  slug: string;
  title_ru: string;
  flag_colors: string[] | null;
};

type FlagSize = "xs" | "sm" | "md" | "lg";

type FlagProps = {
  country: CountryFlag | null;
  size?: FlagSize;
  className?: string;
};

const sizeClassMap: Record<FlagSize, string> = {
  xs: "w-[var(--flag-w-xs)] h-[var(--flag-h-xs)]",
  sm: "w-[var(--flag-w-sm)] h-[var(--flag-h-sm)]",
  md: "w-[var(--flag-w-md)] h-[var(--flag-h-md)]",
  lg: "w-[var(--flag-w-lg)] h-[var(--flag-h-lg)]"
};

export function Flag({ country, size = "md", className }: FlagProps) {
  if (!country || !country.flag_colors || country.flag_colors.length === 0) {
    return null;
  }

  return (
    <span
      role="img"
      aria-label={`Флаг страны: ${country.title_ru}`}
      className={`inline-flex overflow-hidden ${sizeClassMap[size]} ${className ?? ""}`.trim()}
      data-country-slug={country.slug}
    >
      {country.flag_colors.map((color, index) => (
        <span
          key={`${country.id}-${index}-${color}`}
          className="h-full flex-1"
          style={{ backgroundColor: color }}
          data-testid="flag-segment"
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
