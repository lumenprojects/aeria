import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEpisode } from "@/lib/api";
import { EntityAvatar, Flag } from "@/components/entities";
import { MarkdownContent, Separator, Typography } from "@/components/ui";

export default function EpisodeDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["episode", slug],
    queryFn: () => getEpisode(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;
  const titleNative = data.episode.title_native ?? data.episode.title_ru;
  const showRuTitle = data.episode.title_native && data.episode.title_native !== data.episode.title_ru;
  const seriesColor = data.series?.brand_color ?? "var(--accent)";

  return (
    <div className="episode-detail-page">
      <section className="episode-detail-hero width-medium" aria-label="Шапка главы">
        <Separator className="section-break-line width-narrow episode-detail-separator" />
        <div className="episode-detail-heading">
          <Flag country={data.country} size="lg" className="episode-detail-flag" />
          <div className="episode-detail-title-group">
            <Typography variant="h1" as="h1" className="episode-detail-title-en">
              {titleNative}
            </Typography>
            {showRuTitle && (
              <Typography variant="h3" fontRole="body" as="p" className="episode-detail-title-ru tone-secondary">
                {data.episode.title_ru}
              </Typography>
            )}
            {data.series && (
              <Link to={data.series.url} className="episode-detail-series-link ui-underline-hover">
                <span
                  className="episode-detail-series-dot"
                  style={{ backgroundColor: seriesColor }}
                  aria-hidden="true"
                />
                <Typography variant="ui" as="span" className="tone-secondary episode-detail-series-label">
                  {data.series.title_ru}
                </Typography>
              </Link>
            )}
          </div>
          {data.characters.length > 0 && (
            <div className="episode-detail-participants" aria-label="Участники главы">
              {data.characters.map((character) => (
                <EntityAvatar
                  key={character.id}
                  entityType="character"
                  entitySlug={character.slug}
                  imageSrc={character.avatar_asset_path}
                  label={character.name_ru}
                  size="sm"
                  className="episode-detail-avatar-link"
                  avatarClassName="episode-detail-avatar"
                />
              ))}
            </div>
          )}
        </div>
        <Separator className="section-break-line width-narrow episode-detail-separator" />
      </section>
      <MarkdownContent
        source={data.episode.content_markdown || ""}
        preset="reading"
        className="episode-detail-content width-narrow"
      />
    </div>
  );
}
