import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAtlasEntry } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function AtlasDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["atlas", slug],
    queryFn: () => getAtlasEntry(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;

  return (
    <div className="page-stack">
      <Typography variant="h1">{data.entry.title_ru}</Typography>
      {data.entry.summary && <Typography variant="lead">{data.entry.summary}</Typography>}
      <article className="prose max-w-none role-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.entry.content_markdown || ""}</ReactMarkdown>
      </article>
    </div>
  );
}
