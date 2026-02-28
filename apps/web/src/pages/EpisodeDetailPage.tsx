import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getEpisode } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function EpisodeDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["episode", slug],
    queryFn: () => getEpisode(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Typography variant="h1">{data.episode.title_ru}</Typography>
      {data.episode.summary && <Typography variant="lead">{data.episode.summary}</Typography>}
      <div className="rounded-md border border-border p-4">
        <Typography variant="ui">Серия: {data.series?.title_ru ?? "—"}</Typography>
        <Typography variant="ui">Страна: {data.country?.title_ru ?? "—"}</Typography>
      </div>
      <article className="prose max-w-none text-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.episode.content_markdown || ""}</ReactMarkdown>
      </article>
    </div>
  );
}
