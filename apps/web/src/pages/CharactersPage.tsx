import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCharacters } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function CharactersPage() {
  const { data } = useQuery({ queryKey: ["characters"], queryFn: getCharacters });

  return (
    <div className="page-stack">
      <Typography variant="h1">Персонажи</Typography>
      <div className="page-grid">
        {data?.items?.map((character) => (
          <Link key={character.id} to={`/characters/${character.slug}`} className="entity-link-block">
            <Typography variant="h3">{character.name_ru}</Typography>
            {character.description && <Typography variant="muted">{character.description}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}
