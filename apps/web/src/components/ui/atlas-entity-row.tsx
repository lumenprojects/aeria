import { Link } from "react-router-dom";
import type { AtlasCatalogItemDTO, AtlasEntityType, AtlasSection } from "@aeria/shared";
import { Flag } from "@/components/entities";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Typography } from "./typography";

const typeLabels: Record<AtlasEntityType, string> = {
  country: "Страна",
  location: "Локация",
  organization: "Организация",
  object: "Объект",
  event: "Событие",
  belief: "Верование",
  concept: "Понятие",
  other: "Другое"
};

const sectionLabels: Record<AtlasSection, string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AtlasEntityRow({ item }: { item: AtlasCatalogItemDTO }) {
  const leadSection = item.sections[0] ?? null;
  const contextParts = [
    typeLabels[item.type],
    leadSection ? sectionLabels[leadSection] : null
  ].filter(Boolean);
  const placeLabel =
    item.location
      ? item.location.title_ru
      : item.country && item.type !== "country"
        ? item.country.title_ru
        : typeLabels[item.type];
  const sideMark = (leadSection ? sectionLabels[leadSection] : typeLabels[item.type]).slice(0, 3).toUpperCase();

  return (
    <Link to={item.url} className="atlas-entity-row ui-underline-hover" data-testid="atlas-entity-row">
      <div className="atlas-entity-row-copy">
        <div className="atlas-entity-row-header">
          <div className="atlas-entity-row-heading">
            <Typography variant="h3" as="h3" className="atlas-entity-row-title">
              {item.title_ru}
            </Typography>
            <Typography variant="ui" as="p" className="tone-secondary atlas-entity-row-context">
              {contextParts.join(" / ")}
            </Typography>
          </div>

          <Typography variant="ui" as="p" className="tone-tertiary atlas-entity-row-mark" aria-hidden="true">
            {sideMark}
          </Typography>
        </div>

        {item.summary && (
          <Typography variant="body" as="p" fontRole="body" className="tone-secondary atlas-entity-row-summary">
            {item.summary}
          </Typography>
        )}

        <div className="atlas-entity-row-meta">
          <div className="atlas-entity-row-meta-primary">
            {item.avatar_asset_path ? (
              <Avatar size="sm" className="atlas-entity-row-avatar">
                <AvatarImage src={item.avatar_asset_path} alt={item.title_ru} loading="lazy" decoding="async" />
                <AvatarFallback>{fallbackText(item.title_ru)}</AvatarFallback>
              </Avatar>
            ) : item.country ? (
              <Flag country={item.country} size="sm" className="atlas-entity-row-flag" />
            ) : (
              <span className="atlas-entity-row-mark-dot" aria-hidden="true" />
            )}

            <Typography variant="ui" as="span" className="tone-secondary atlas-entity-row-place">
              {placeLabel}
            </Typography>
          </div>

          <Typography variant="ui" as="span" className="tone-tertiary atlas-entity-row-related">
            {item.related_count} связ.
          </Typography>

          <Typography variant="ui" as="span" className="tone-secondary atlas-entity-row-arrow" aria-hidden="true">
            &gt;
          </Typography>
        </div>
      </div>
    </Link>
  );
}
