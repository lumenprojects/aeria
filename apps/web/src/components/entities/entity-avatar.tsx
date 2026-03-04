import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage, type AvatarSize } from "@/components/ui/avatar";

type EntityAvatarType = "character" | "location" | "atlas_entry";

type EntityAvatarProps = {
  entityType: EntityAvatarType;
  entitySlug: string;
  imageSrc: string;
  label: string;
  size?: AvatarSize;
};

function resolveEntityHref(type: EntityAvatarType, slug: string) {
  switch (type) {
    case "character":
      return `/characters/${slug}`;
    case "location":
    case "atlas_entry":
      return `/atlas/${slug}`;
    default:
      return "/";
  }
}

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EntityAvatar({
  entityType,
  entitySlug,
  imageSrc,
  label,
  size = "md"
}: EntityAvatarProps) {
  return (
    <Link to={resolveEntityHref(entityType, entitySlug)} aria-label={label} className="inline-flex rounded-full">
      <Avatar size={size}>
        <AvatarImage src={imageSrc} alt={label} loading="lazy" decoding="async" />
        <AvatarFallback>{fallbackText(label)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
