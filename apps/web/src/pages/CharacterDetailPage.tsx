import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCharacter } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function CharacterDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["character", slug],
    queryFn: () => getCharacter(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;

  return (
    <div className="page-stack">
      <Typography variant="h1">{data.character.name_ru}</Typography>
      {data.character.description && <Typography variant="lead">{data.character.description}</Typography>}
      <article className="prose max-w-none role-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.character.bio_markdown || ""}</ReactMarkdown>
      </article>
    </div>
  );
}
