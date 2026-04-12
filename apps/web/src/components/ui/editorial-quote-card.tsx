import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Typography } from "./typography";

type EditorialQuoteCardProps = {
  text: string;
  speaker: string;
  speakerMeta?: string | null;
  speakerHref?: string;
  avatarSrc?: string | null;
  avatarLabel?: string | null;
  avatarHref?: string;
  avatarSize?: "xs" | "sm" | "md" | "lg";
  avatarClassName?: string;
  secondaryLinkLabel?: string | null;
  secondaryLinkHref?: string;
  className?: string;
};

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EditorialQuoteCard({
  text,
  speaker,
  speakerMeta,
  speakerHref,
  avatarSrc,
  avatarLabel,
  avatarHref,
  avatarSize = "sm",
  avatarClassName,
  secondaryLinkLabel,
  secondaryLinkHref,
  className
}: EditorialQuoteCardProps) {
  const resolvedAvatarLabel = avatarLabel?.trim() || speaker;

  const avatar = avatarSrc ? (
    <Avatar size={avatarSize} className={cn("editorial-quote-avatar", avatarClassName)}>
      <AvatarImage src={avatarSrc} alt={resolvedAvatarLabel} loading="lazy" decoding="async" />
      <AvatarFallback>{fallbackText(resolvedAvatarLabel)}</AvatarFallback>
    </Avatar>
  ) : null;

  return (
    <figure className={cn("editorial-quote-card", className)}>
      <blockquote className="editorial-quote-text">
        <Typography variant="body" as="p" className="editorial-quote-copy">
          {text}
        </Typography>
      </blockquote>

      <figcaption className="editorial-quote-footer">
        {avatar ? (
          avatarHref ? (
            <Link to={avatarHref} className="editorial-quote-avatar-link">
              {avatar}
            </Link>
          ) : (
            <span className="editorial-quote-avatar-link">{avatar}</span>
          )
        ) : null}

        <div className="editorial-quote-source">
          {speakerHref ? (
            <Link to={speakerHref} className="editorial-quote-speaker-link ui-underline-hover">
              <Typography variant="ui" as="span" className="editorial-quote-speaker">
                {speaker}
              </Typography>
            </Link>
          ) : (
            <Typography variant="ui" as="p" className="editorial-quote-speaker">
              {speaker}
            </Typography>
          )}

          {speakerMeta ? (
            <Typography variant="ui" as="p" className="tone-secondary editorial-quote-meta">
              {speakerMeta}
            </Typography>
          ) : null}

          {secondaryLinkHref && secondaryLinkLabel ? (
            <Link to={secondaryLinkHref} className="editorial-quote-secondary-link ui-underline-hover">
              {secondaryLinkLabel}
            </Link>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}
