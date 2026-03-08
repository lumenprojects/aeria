import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAtlasEntry } from "@/lib/api";
import { MarkdownContent, Typography } from "@/components/ui";

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
      <MarkdownContent source={data.entry.content_markdown || ""} />
    </div>
  );
}
