import { Link } from "react-router-dom";
import type { WorldNodeListItemDTO } from "@aeria/shared";
import { Flag } from "@/components/entities";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Typography } from "./typography";

const nodeTypeLabels: Record<WorldNodeListItemDTO["node_type"], string> = {
  country: "Страна",
  location: "Локация",
  atlas_entry: "Запись атласа"
};

const kindLabels: Record<NonNullable<WorldNodeListItemDTO["kind"]>, string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const anchorModeLabels: Record<WorldNodeListItemDTO["anchor_mode"], string> = {
  country: "Страновой узел",
  location: "Локальный узел",
  free: "Свободная запись"
};

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorldNodeRow({ item }: { item: WorldNodeListItemDTO }) {
  const contextParts = [
    item.kind ? kindLabels[item.kind] : nodeTypeLabels[item.node_type],
    item.location && item.node_type !== "location" ? item.location.title_ru : null,
    item.country && item.node_type !== "country" ? item.country.title_ru : null,
    item.node_type === "atlas_entry" ? anchorModeLabels[item.anchor_mode] : null
  ].filter(Boolean);

  return (
    <Link to={item.url} className="world-node-row ui-underline-hover" data-testid="world-node-row">
      <div className="world-node-row-media">
        {item.avatar_asset_path ? (
          <Avatar size="sm" className="world-node-row-avatar">
            <AvatarImage src={item.avatar_asset_path} alt={item.title_ru} loading="lazy" decoding="async" />
            <AvatarFallback>{fallbackText(item.title_ru)}</AvatarFallback>
          </Avatar>
        ) : item.country ? (
          <Flag country={item.country} size="sm" className="world-node-row-flag" />
        ) : (
          <Typography variant="ui" as="span" className="tone-tertiary world-node-row-mark" aria-hidden="true">
            {item.node_type === "atlas_entry" && item.kind ? kindLabels[item.kind].slice(0, 3).toUpperCase() : item.node_type.slice(0, 3).toUpperCase()}
          </Typography>
        )}
      </div>

      <div className="world-node-row-copy">
        <div className="world-node-row-head">
          <Typography variant="h3" as="h3" className="world-node-row-title">
            {item.title_ru}
          </Typography>
          <Typography variant="ui" as="p" className="tone-secondary world-node-row-context">
            {contextParts.join(" / ")}
          </Typography>
        </div>

        {item.summary && (
          <Typography variant="body" as="p" fontRole="body" className="tone-secondary world-node-row-summary">
            {item.summary}
          </Typography>
        )}

        <div className="world-node-row-meta">
          <Typography variant="ui" as="span" className="tone-tertiary world-node-row-related">
            Связей: {item.related_count}
          </Typography>
          <Typography variant="ui" as="span" className="world-node-row-arrow" aria-hidden="true">
            &gt;
          </Typography>
        </div>
      </div>
    </Link>
  );
}
