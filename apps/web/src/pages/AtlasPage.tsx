import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getAtlas } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function AtlasPage() {
  const [params] = useSearchParams();
  const kind = params.get("kind") || undefined;
  const { data } = useQuery({ queryKey: ["atlas", kind], queryFn: () => getAtlas({ kind }) });

  return (
    <div className="page-stack">
      <Typography variant="h1">Атлас</Typography>
      <div className="page-list">
        {data?.items?.map((entry) => (
          <Link key={entry.id} to={entry.url} className="entity-link-block">
            <Typography variant="h3">{entry.title_ru}</Typography>
            {entry.summary && <Typography variant="muted">{entry.summary}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}
