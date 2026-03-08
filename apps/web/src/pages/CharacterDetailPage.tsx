import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Flag } from "@/components/entities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCharacter } from "@/lib/api";
import { Typography } from "@/components/ui/typography";

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function resolveSourceHref(source: { type: "character" | "atlas_entry"; slug: string }) {
  return source.type === "character" ? `/characters/${source.slug}` : `/atlas/${source.slug}`;
}

export default function CharacterDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["character", slug],
    queryFn: () => getCharacter(slug || ""),
    enabled: Boolean(slug)
  });

  if (!data) return null;

  const parameterItems = [
    { label: "Раса", value: data.character.race },
    { label: "Рост", value: data.character.height_cm ? `${data.character.height_cm} см` : null },
    { label: "Возраст", value: data.character.age ? `${data.character.age}` : null },
    { label: "Пол", value: data.character.gender },
    { label: "Ориентация", value: data.character.orientation },
    { label: "MBTI", value: data.character.mbti },
    { label: "Любимая еда", value: data.character.favorite_food }
  ].filter((item) => item.value);

  return (
    <div className="page-stack">
      <section className="flex flex-col gap-6 md:flex-row md:items-start">
        <Avatar size="lg">
          <AvatarImage src={data.character.avatar_asset_path} alt={data.character.name_ru} />
          <AvatarFallback>{fallbackText(data.character.name_ru)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="showcase-stack-xs">
            <Typography variant="h1">{data.character.name_ru}</Typography>
            {data.character.name_native && (
              <Typography variant="h4" className="tone-secondary">
                {data.character.name_native}
              </Typography>
            )}
            {data.character.tagline && <Typography variant="lead">{data.character.tagline}</Typography>}
          </div>

          <div className="showcase-row-sm">
            {data.country && <Flag country={data.country} size="lg" />}
            {data.country && <Typography variant="ui">{data.country.title_ru}</Typography>}
            {data.affiliation && (
              <Typography variant="ui">
                Принадлежность:{" "}
                <Link to={`/atlas/${data.affiliation.slug}`} className="underline decoration-[1px] underline-offset-4">
                  {data.affiliation.title_ru}
                </Link>
              </Typography>
            )}
          </div>

          {parameterItems.length > 0 && (
            <div className="detail-meta">
              {parameterItems.map((item) => (
                <Typography key={item.label} variant="ui">
                  {item.label}: {item.value}
                </Typography>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="showcase-stack-sm">
        <Typography variant="h2" as="h2">
          Биография
        </Typography>
        <article className="prose max-w-none role-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.character.bio_markdown || ""}</ReactMarkdown>
        </article>
      </section>

      {data.quirks.length > 0 && (
        <section className="showcase-stack-sm">
          <Typography variant="h2" as="h2">
            Особые приметы
          </Typography>
          <div className="showcase-stack-xs">
            {data.quirks.map((quirk) => (
              <Typography key={`${quirk.sort_order}-${quirk.text}`} variant="body">
                {quirk.sort_order + 1}. {quirk.text}
              </Typography>
            ))}
          </div>
        </section>
      )}

      {data.rumors.length > 0 && (
        <section className="showcase-stack-sm">
          <Typography variant="h2" as="h2">
            Что говорят другие?
          </Typography>
          <div className="page-grid">
            {data.rumors.map((rumor) => (
              <article key={`${rumor.sort_order}-${rumor.author_name}`} className="showcase-panel showcase-stack-xs">
                <Typography variant="body">{rumor.text}</Typography>
                <Typography variant="muted">
                  {rumor.author_name}
                  {rumor.author_meta ? `, ${rumor.author_meta}` : ""}
                </Typography>
                {rumor.source && (
                  <div className="showcase-row-xs">
                    {rumor.source.avatar_asset_path && (
                      <Link to={resolveSourceHref(rumor.source)}>
                        <Avatar size="xs">
                          <AvatarImage src={rumor.source.avatar_asset_path} alt={rumor.source.title} />
                          <AvatarFallback>{fallbackText(rumor.source.title)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    )}
                    <Typography variant="ui">
                      Источник:{" "}
                      <Link
                        to={resolveSourceHref(rumor.source)}
                        className="underline decoration-[1px] underline-offset-4"
                      >
                        {rumor.source.title}
                      </Link>
                    </Typography>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
