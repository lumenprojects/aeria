import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AtlasPreviewDTO, CharacterPreviewDTO } from "@aeria/shared";
import { Link } from "react-router-dom";
import { Flag } from "@/components/entities";
import { getAtlasPreview, getCharacterPreview } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Typography } from "./typography";

type InlineEntityReferenceProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

type ParsedEntityReference =
  | {
      entityType: "character";
      slug: string;
      href: string;
    }
  | {
      entityType: "atlas";
      slug: string;
      href: string;
    };

type PreviewData = CharacterPreviewDTO | AtlasPreviewDTO;

const atlasKindLabels: Record<AtlasPreviewDTO["kind"], string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

function parseEntityReference(href: string): ParsedEntityReference | null {
  const characterMatch = href.match(/^\/characters\/([^/?#]+)/);
  if (characterMatch) {
    return { entityType: "character", slug: characterMatch[1], href };
  }

  const atlasMatch = href.match(/^\/atlas\/([^/?#]+)/);
  if (atlasMatch) {
    return { entityType: "atlas", slug: atlasMatch[1], href };
  }

  return null;
}

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function useIsCoarsePointer() {
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const hoverNoneMedia = window.matchMedia("(hover: none)");
    const pointerCoarseMedia = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setIsCoarsePointer(
        hoverNoneMedia.matches ||
          pointerCoarseMedia.matches ||
          (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
      );
    };

    update();
    hoverNoneMedia.addEventListener("change", update);
    pointerCoarseMedia.addEventListener("change", update);
    return () => {
      hoverNoneMedia.removeEventListener("change", update);
      pointerCoarseMedia.removeEventListener("change", update);
    };
  }, []);

  return isCoarsePointer;
}

function CharacterPreviewBody({ preview }: { preview: CharacterPreviewDTO }) {
  return (
    <>
      <div className="entity-reference-preview-head">
        <Avatar size="sm">
          <AvatarImage src={preview.avatar_asset_path} alt={preview.name_ru} />
          <AvatarFallback>{fallbackText(preview.name_ru)}</AvatarFallback>
        </Avatar>
        <div className="entity-reference-preview-copy">
          <Typography variant="h4" as="p">
            {preview.name_ru}
          </Typography>
          {preview.name_native && (
            <Typography variant="ui" className="tone-secondary">
              {preview.name_native}
            </Typography>
          )}
        </div>
      </div>
      {preview.tagline && (
        <Typography variant="ui" className="tone-secondary entity-reference-preview-summary">
          {preview.tagline}
        </Typography>
      )}
      {(preview.country || preview.affiliation) && (
        <div className="entity-reference-preview-meta">
          {preview.country && (
            <div className="entity-reference-preview-country">
              <Flag country={preview.country} size="sm" />
            </div>
          )}
          {preview.affiliation && (
            <Typography variant="ui" className="tone-secondary">
              {preview.affiliation.title_ru}
            </Typography>
          )}
        </div>
      )}
    </>
  );
}

function AtlasPreviewBody({ preview }: { preview: AtlasPreviewDTO }) {
  return (
    <>
      <div className="entity-reference-preview-head">
        {preview.avatar_asset_path ? (
          <Avatar size="sm">
            <AvatarImage src={preview.avatar_asset_path} alt={preview.title_ru} />
            <AvatarFallback>{fallbackText(preview.title_ru)}</AvatarFallback>
          </Avatar>
        ) : null}
        <div className="entity-reference-preview-copy">
          <Typography variant="ui" className="tone-secondary entity-reference-preview-kind">
            {atlasKindLabels[preview.kind]}
          </Typography>
          <Typography variant="h4" as="p">
            {preview.title_ru}
          </Typography>
        </div>
      </div>
      {preview.summary && (
        <Typography variant="ui" className="tone-secondary entity-reference-preview-summary">
          {preview.summary}
        </Typography>
      )}
      {preview.country && preview.country.slug !== preview.slug && (
        <div className="entity-reference-preview-meta">
          <div className="entity-reference-preview-country">
            <Flag country={preview.country} size="sm" />
          </div>
          <Typography variant="ui" className="tone-secondary">
            {preview.country.title_ru}
          </Typography>
        </div>
      )}
    </>
  );
}

function EntityReferencePreviewSurface({
  reference,
  showCta,
  onNavigate
}: {
  reference: ParsedEntityReference;
  showCta?: boolean;
  onNavigate?: () => void;
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["entity-preview", reference.entityType, reference.slug],
    queryFn: async (): Promise<PreviewData> =>
      reference.entityType === "character" ? getCharacterPreview(reference.slug) : getAtlasPreview(reference.slug),
    staleTime: 1000 * 60 * 5
  });

  const title = reference.entityType === "character" ? "Открыть персонажа" : "Открыть запись";

  return (
    <div className="entity-reference-preview">
      {isLoading ? (
        <Typography variant="ui" className="tone-secondary">
          Загружаем справку...
        </Typography>
      ) : error || !data ? (
        <Typography variant="ui" className="tone-secondary">
          Не удалось загрузить справку.
        </Typography>
      ) : reference.entityType === "character" ? (
        <CharacterPreviewBody preview={data as CharacterPreviewDTO} />
      ) : (
        <AtlasPreviewBody preview={data as AtlasPreviewDTO} />
      )}

      {showCta ? (
        <Link to={reference.href} className="entity-reference-preview-cta ui-underline-hover" onClick={onNavigate}>
          <Typography as="span" variant="ui">
            {title}
          </Typography>
        </Link>
      ) : null}
    </div>
  );
}

export function InlineEntityReference({ href, children, className }: InlineEntityReferenceProps) {
  const reference = useMemo(() => parseEntityReference(href), [href]);
  const [open, setOpen] = useState(false);
  const isCoarsePointer = useIsCoarsePointer();

  if (!reference) {
    return (
      <a href={href} className={cn("markdown-link", className)}>
        {children}
      </a>
    );
  }

  if (isCoarsePointer) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Link
            to={href}
            className={cn("markdown-link inline-entity-reference", className)}
            onClick={(event) => {
              event.preventDefault();
              setOpen((current) => !current);
            }}
            aria-haspopup="dialog"
          >
            {children}
          </Link>
        </PopoverTrigger>
        <PopoverContent className="entity-reference-preview-surface" align="start">
          <EntityReferencePreviewSurface reference={reference} showCta onNavigate={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={0} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link to={href} className={cn("markdown-link inline-entity-reference", className)}>
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="entity-reference-preview-surface">
        <EntityReferencePreviewSurface reference={reference} />
      </HoverCardContent>
    </HoverCard>
  );
}
