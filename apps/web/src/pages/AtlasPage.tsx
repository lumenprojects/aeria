import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getAtlas } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function AtlasPage() {
  const [params] = useSearchParams();
  const kind = params.get("kind") || undefined;
  const { data } = useQuery({ queryKey: ["atlas", kind], queryFn: () => getAtlas({ kind }) });

  return (
    <div className="space-y-6">
      <Typography variant="h1">Атлас</Typography>
      <div className="space-y-3">
        {data?.items?.map((entry) => (
          <Link key={entry.id} to={`/atlas/${entry.slug}`} className="block rounded-md border border-border p-4">
            <Typography variant="h3">{entry.title_ru}</Typography>
            {entry.summary && <Typography variant="muted">{entry.summary}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}
