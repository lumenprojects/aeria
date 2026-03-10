import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { HomeLatestEpisodeDTO } from "@aeria/shared";
import { EntityAvatar, Flag } from "@/components/entities";
import { RevealText, Typography } from "@/components/ui";

type LatestEpisodeHeroProps = {
  episode: HomeLatestEpisodeDTO;
};

export function LatestEpisodeHero({ episode }: LatestEpisodeHeroProps) {
  const heroTitle = episode.title_native ?? episode.title_ru;
  const subtitle = episode.title_native ? episode.title_ru : null;
  const participants = episode.participants.slice(0, 3);
  const seriesColor = episode.series?.brand_color ?? "var(--accent)";

  return (
    <article className="home-latest-hero theme-stroke theme-stroke-accent">
      <div className="home-latest-header">
        <div className="home-latest-heading">
          <Typography variant="h1" as="h1" className="home-latest-title"><RevealText text={heroTitle} mode="chars" /></Typography>
          {subtitle && (
            <Typography variant="h3" as="h2" className="home-latest-subtitle tone-secondary"><RevealText text={subtitle} mode="words" delay={0.36} /></Typography>
          )}
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
          <Flag country={episode.country} size="sm" className="home-latest-flag" />
        </div>

        <Link to={episode.url} className="home-latest-read ui-underline">
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
