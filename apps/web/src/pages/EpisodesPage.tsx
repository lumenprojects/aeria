import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getEpisodes } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

type EpisodeListItem = {
  id: string;
  slug: string;
  title_ru: string;
  summary: string | null;
  episode_number: number;
  reading_minutes: number | null;
  published_at: string | null;
  country?: {
    title_ru?: string | null;
  } | null;
};

const publishedAtFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function formatEpisodeNumber(value: number) {
  return String(value).padStart(2, "0");
}

function formatPublishedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return publishedAtFormatter.format(date);
}

function buildEpisodeMeta(episode: EpisodeListItem) {
  const meta: string[] = [];

  if (episode.country?.title_ru) {
    meta.push(episode.country.title_ru);
  }

  if (typeof episode.reading_minutes === "number") {
    meta.push(`${episode.reading_minutes} мин`);
  }

  const publishedAt = formatPublishedAt(episode.published_at);
  if (publishedAt) {
    meta.push(publishedAt);
  }

  return meta;
}

export default function EpisodesPage() {
  const [params] = useSearchParams();
  const series = params.get("series") || undefined;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["episodes", series],
    queryFn: () => getEpisodes({ series })
  });
  const items = (data?.items ?? []) as EpisodeListItem[];

  return (
    <div className="page-stack">
      <Typography variant="h1" as="h1" className="sr-only">
        Эпизоды
      </Typography>

      <section className="episodes-intro">
        <Typography variant="ui" as="p" className="episodes-intro-kicker tone-secondary">
          Ход истории
        </Typography>
        <Typography variant="lead" as="p">
          История здесь раскрывается не сводкой, а мягкой чередой глав. В нее лучше входить постепенно: с самого
          начала, с паузы посреди пути или с того места, где хочется задержаться чуть дольше.
        </Typography>
        <Typography variant="body" as="p" className="tone-secondary">
          Ниже только сам путь: сцены, ритм, время чтения и тихий контекст вокруг каждой главы. Без витринности и
          лишнего шума.
        </Typography>
      </section>

      {isLoading && (
        <Typography variant="body" as="p" className="episodes-status tone-secondary">
          Лента собирается. Еще мгновение.
        </Typography>
      )}

      {isError && !isLoading && (
        <Typography variant="body" as="p" className="episodes-status tone-secondary">
          Не удалось открыть ленту. Попробуйте еще раз чуть позже.
        </Typography>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Typography variant="body" as="p" className="episodes-status tone-secondary">
          Пока здесь тихо. Новые главы еще не появились.
        </Typography>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="episodes-feed" data-testid="episodes-feed">
          {items.map((episode) => {
            const meta = buildEpisodeMeta(episode);

            return (
              <Link key={episode.id} to={`/episodes/${episode.slug}`} className="episodes-entry">
                <div className="episodes-entry-index">
                  <Typography variant="ui" as="span">
                    {formatEpisodeNumber(episode.episode_number)}
                  </Typography>
                </div>

                <div className="episodes-entry-body">
                  <Typography variant="h3" as="h2" className="episodes-entry-title">
                    {episode.title_ru}
                  </Typography>

                  {episode.summary && (
                    <Typography variant="body" as="p" className="episodes-entry-summary tone-secondary">
                      {episode.summary}
                    </Typography>
                  )}

                  {meta.length > 0 && (
                    <div className="episodes-meta">
                      {meta.map((item) => (
                        <Typography key={`${episode.id}-${item}`} variant="ui" as="span" className="tone-secondary">
                          {item}
                        </Typography>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
