import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage, type AvatarSize } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type EntityAvatarType = "character" | "location" | "atlas_entity";

type EntityAvatarProps = {
  entityType: EntityAvatarType;
  entitySlug: string;
  imageSrc: string;
  label: string;
  ariaLabel?: string;
  size?: AvatarSize;
  className?: string;
  avatarClassName?: string;
};

function resolveEntityHref(type: EntityAvatarType, slug: string) {
  switch (type) {
    case "character":
      return `/characters/${slug}`;
    case "location":
    case "atlas_entity":
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
  ariaLabel,
  size = "md",
  className,
  avatarClassName
}: EntityAvatarProps) {
  return (
    <Link
      to={resolveEntityHref(entityType, entitySlug)}
      aria-label={ariaLabel ?? label}
      className={cn("inline-flex rounded-full", className)}
    >
      <Avatar size={size} className={avatarClassName}>
        <AvatarImage src={imageSrc} alt={label} loading="lazy" decoding="async" />
        <AvatarFallback>{fallbackText(label)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
