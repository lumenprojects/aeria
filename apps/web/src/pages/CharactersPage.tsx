import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CharacterFactOfDaySection } from "@/components/characters/CharacterFactOfDaySection";
import { getCharacterFactOfDay, getCharacters } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

export default function CharactersPage() {
  const charactersQuery = useQuery({
    queryKey: ["characters"],
    queryFn: getCharacters
  });
  const factOfDayQuery = useQuery({
    queryKey: ["characters", "fact-of-day"],
    queryFn: getCharacterFactOfDay,
    retry: false
  });

  return (
    <div className="page-stack">
      <CharacterFactOfDaySection
        factOfDay={factOfDayQuery.data ?? null}
        isLoading={factOfDayQuery.isLoading}
        isError={factOfDayQuery.isError}
      />
      <div className="page-grid">
        {charactersQuery.data?.items?.map((character) => (
          <Link key={character.id} to={character.url} className="entity-link-block">
            <Typography variant="h3">{character.name_ru}</Typography>
            {character.tagline && <Typography variant="muted">{character.tagline}</Typography>}
          </Link>
        ))}
      </div>
    </div>
  );
}

