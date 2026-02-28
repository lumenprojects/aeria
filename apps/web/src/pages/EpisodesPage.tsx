import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getEpisodes } from "@/lib/api";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodesPage() {
  const [params] = useSearchParams();
  const series = params.get("series") || undefined;
  const { data, isLoading } = useQuery({
    queryKey: ["episodes", series],
    queryFn: () => getEpisodes({ series })
  });

  return (
    <div className="space-y-6">
      <Typography variant="h1">Эпизоды</Typography>
      {isLoading && <Skeleton className="h-10 w-full" />}
      <div className="space-y-3">
        {data?.items?.map((episode) => (
          <Link key={episode.id} to={`/episodes/${episode.slug}`} className="block rounded-md border border-border p-4">
            <Typography variant="h3">{episode.title_ru}</Typography>
            {episode.summary && <Typography variant="muted">{episode.summary}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}
