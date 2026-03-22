import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { HomeLatestEpisodeDTO } from "@aeria/shared";
import { EntityAvatar, Flag } from "@/components/entities";
import { RevealText, Skeleton, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

type LatestEpisodeProps = {
  episode: HomeLatestEpisodeDTO | null;
  titleAs?: "h1" | "h2" | "p";
  subtitleAs?: "h2" | "h3" | "p";
  emptyStateTitle?: string | null;
  className?: string;
  isLoading?: boolean;
};

export function LatestEpisode({
  episode,
  titleAs = "h1",
  subtitleAs = "h2",
  emptyStateTitle = "Последняя глава",
  className,
  isLoading = false
}: LatestEpisodeProps) {
  if (isLoading) {
    return (
      <article className={cn("home-latest-hero theme-stroke theme-stroke-accent", className)} aria-busy="true">
        <div className="home-latest-header">
          <div className="home-latest-heading">
            <Skeleton className="h-14 w-64 rounded-lg" />
            <Skeleton className="h-8 w-80 rounded-lg" />
          </div>
          <Skeleton className="h-14 w-12 rounded-lg" />
        </div>

        <div className="home-latest-participants" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`latest-episode-loading-avatar-${index}`} className="h-[var(--avatar-sm)] w-[var(--avatar-sm)] rounded-full" />
          ))}
        </div>

        <Skeleton className="h-16 w-full rounded-lg" />

        <div className="home-latest-footer">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-[var(--flag-h-lg)] w-[var(--flag-w-lg)] rounded-lg justify-self-center" />
          <Skeleton className="h-8 w-24 justify-self-end rounded-lg" />
        </div>
      </article>
    );
  }

  if (!episode) {
    return (
      <article className={cn("home-latest-hero theme-stroke theme-stroke-accent", className)}>
        <div className="home-latest-header">
          <div className="home-latest-heading">
            {emptyStateTitle ? (
              <Typography variant="h1" as={titleAs} className="home-latest-title">
                {emptyStateTitle}
              </Typography>
            ) : null}
            <Typography variant="h3" as={subtitleAs} className="home-latest-subtitle tone-secondary">
              Раздел уже собран, ждёт первую актуальную запись.
            </Typography>
          </div>
        </div>

        <Typography variant="h3" fontRole="body" className="home-latest-summary width-narrow tone-secondary">
          После добавления и импорта новых эпизодов здесь снова появится актуальная глава с участниками и переходом к
          чтению.
        </Typography>
      </article>
    );
  }

  const heroTitle = episode.title_native ?? episode.title_ru;
  const subtitle = episode.title_native ? episode.title_ru : null;
  const participants = episode.participants.slice(0, 3);
  const seriesColor = episode.series?.brand_color ?? "var(--accent)";

  return (
    <article className={cn("home-latest-hero theme-stroke theme-stroke-accent", className)}>
      <div className="home-latest-header">
        <div className="home-latest-heading">
          <Typography variant="h1" as={titleAs} className="home-latest-title">
            <RevealText text={heroTitle} mode="chars" />
          </Typography>
          <Typography variant="h3" as={subtitleAs} className="home-latest-subtitle tone-secondary">
            {subtitle ? <RevealText text={subtitle} mode="words" delay={0.24} /> : null}
          </Typography>
        </div>
        <Typography variant="h1" as="p" className="home-latest-number">
          {episode.episode_number}
        </Typography>
      </div>

      {participants.length > 0 && (
        <div className="home-latest-participants" aria-label="Участники главы">
          {participants.map((participant) => (
            <EntityAvatar
              key={participant.id}
              entityType="character"
              entitySlug={participant.slug}
              imageSrc={participant.avatar_asset_path}
              label={participant.name_ru}
              size="sm"
              className="home-latest-avatar-link"
              avatarClassName="home-latest-avatar"
            />
          ))}
        </div>
      )}

      {episode.summary && (
        <Typography variant="h3" fontRole="body" className="home-latest-summary width-narrow">
          {episode.summary}
        </Typography>
      )}

      <div className="home-latest-footer">
        <div className="home-latest-series-slot">
          {episode.series && (
            <Link to={episode.series.url} className="home-latest-series">
              <span
                className="home-latest-series-dot"
                style={{ backgroundColor: seriesColor } as CSSProperties}
                aria-hidden="true"
              />
              <Typography variant="ui" as="span" className="home-latest-series-label">
                {episode.series.title_ru}
              </Typography>
            </Link>
          )}
        </div>

        <div className="home-latest-flag-slot">
          <Flag country={episode.country} size="lg" className="home-latest-flag" />
        </div>

        <Link to={episode.url} className="home-latest-read ui-underline-hover">
          <Typography variant="h3" fontRole="ui" as="span" className="home-latest-read-label">
            Читать
          </Typography>
          <Typography variant="h3" fontRole="ui" as="span" className="home-latest-read-arrow" aria-hidden="true">
            &gt;
          </Typography>
        </Link>
      </div>
    </article>
  );
}
