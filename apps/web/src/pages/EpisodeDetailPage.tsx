import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEpisode } from "@/lib/api";
import { MarkdownContent, Typography } from "@/components/ui";

export default function EpisodeDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["episode", slug],
    queryFn: () => getEpisode(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;

  return (
    <div className="page-stack">
      <Typography variant="h1">{data.episode.title_ru}</Typography>
      {data.episode.summary && <Typography variant="lead">{data.episode.summary}</Typography>}
      <div className="detail-meta">
        <Typography variant="ui">Серия: {data.series?.title_ru ?? "—"}</Typography>
        <Typography variant="ui">Страна: {data.country?.title_ru ?? "—"}</Typography>
      </div>
      <MarkdownContent source={data.episode.content_markdown || ""} />
    </div>
  );
}
