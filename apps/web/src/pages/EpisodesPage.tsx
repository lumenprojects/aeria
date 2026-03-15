import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getEpisodes } from "@/lib/api";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodesPage() {
  const [params] = useSearchParams();
  const series = params.get("series") || undefined;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["episodes", series],
    queryFn: () => getEpisodes({ series }),
    retry: 1
  });

  return (
    <div className="page-stack">
      <Typography variant="h1">Эпизоды</Typography>
      {isLoading && <Skeleton className="h-10 w-full" />}
      {isError && !isLoading && (
        <Typography variant="muted">Не удалось загрузить список эпизодов.</Typography>
      )}
      <div className="page-list">
        {data?.items?.map((episode) => (
          <Link key={episode.id} to={episode.url} className="entity-link-block">
            <Typography variant="h3">{episode.title_ru}</Typography>
            {episode.summary && <Typography variant="muted">{episode.summary}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}
