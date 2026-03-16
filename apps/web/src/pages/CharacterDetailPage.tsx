import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Flag } from "@/components/entities";
import { CharacterDetailFeedConveyor } from "@/components/characters/CharacterDetailFeedConveyor";
import { Avatar, AvatarFallback, AvatarImage, MarkdownContent, SectionBreak, Typography } from "@/components/ui";
import { getCharacter } from "@/lib/api";

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatReadingMinutesLabel(readingMinutes: number | null) {
  if (readingMinutes === null) return null;
  const unit = readingMinutes % 10 === 1 && readingMinutes % 100 !== 11 ? "минута" : "мин";
  return `${readingMinutes} ${unit}`;
}

function formatEpisodeOrder(value: number) {
  return String(value).padStart(2, "0");
}

function prepareBiography(markdown: string | null) {
  if (!markdown) return "";
  return markdown.replace(/^#\s.+(?:\r?\n)+/, "").trim();
}

export default function CharacterDetailPage() {
  const { slug } = useParams();
  const { data } = useQuery({
    queryKey: ["character", slug],
    queryFn: () => getCharacter(slug || ""),
    enabled: Boolean(slug)
  });
  const nameFlagRef = React.useRef<HTMLSpanElement | null>(null);
  const [isNameFlagVisible, setIsNameFlagVisible] = React.useState(false);

  React.useEffect(() => {
    if (!data?.country) {
      setIsNameFlagVisible(false);
      return;
    }

    const node = nameFlagRef.current;
    if (!node) {
      setIsNameFlagVisible(false);
      return;
    }

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          setIsNameFlagVisible(entries[0]?.isIntersecting ?? false);
        },
        { threshold: 0.6 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }

    const handleVisibilityFallback = () => {
      const rect = node.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      setIsNameFlagVisible(isVisible);
    };

    handleVisibilityFallback();
    window.addEventListener("scroll", handleVisibilityFallback, { passive: true });
    window.addEventListener("resize", handleVisibilityFallback);
    return () => {
      window.removeEventListener("scroll", handleVisibilityFallback);
      window.removeEventListener("resize", handleVisibilityFallback);
    };
  }, [data?.country?.id]);

  if (!data) return null;

  const biographySource = prepareBiography(data.character.bio_markdown);
  const parameterItems = [
    { key: "age", label: "Возраст", iconPath: "/assets/emojis/apple/birthday-cake_1f382.png", value: data.character.age ? `${data.character.age} лет` : null },
    { key: "height", label: "Рост", iconPath: "/assets/emojis/apple/straight-ruler_1f4cf.png", value: data.character.height_cm ? `${data.character.height_cm}см` : null },
    { key: "race", label: "Раса", iconPath: "/assets/emojis/apple/dna_1f9ec.png", value: data.character.race },
    { key: "gender", label: "Пол", iconPath: "/assets/emojis/apple/transgender-symbol_26a7-fe0f.png", value: data.character.gender },
    { key: "orientation", label: "Ориентация", iconPath: "/assets/emojis/apple/red-heart_2764-fe0f.png", value: data.character.orientation },
    { key: "food", label: "Любимая еда", iconPath: "/assets/emojis/apple/bread_1f35e.png", value: data.character.favorite_food },
    { key: "mbti", label: "MBTI", iconPath: "/assets/emojis/apple/sparkles_2728.png", value: data.character.mbti },
    {
      key: "affiliation",
      label: "Принадлежность",
      iconPath: "/assets/emojis/apple/classical-building_1f3db-fe0f.png",
      value: data.affiliation?.title_ru ?? null,
      href: data.affiliation?.url
    }
  ].filter((item) => item.value);

  return (
    <div className="page-stack character-detail-page" data-testid="character-detail-page">
      <section className="width-wide character-detail-hero" aria-label={`Профиль персонажа ${data.character.name_ru}`}>
        <div className="character-detail-hero-core">
          <div className="character-detail-identity">
            <div className="character-detail-avatar-shell">
              <Avatar size="lg" className="character-detail-avatar">
                <AvatarImage src={data.character.avatar_asset_path} alt={data.character.name_ru} />
                <AvatarFallback>{fallbackText(data.character.name_ru)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="character-detail-intro">
              <div className="character-detail-title-group">
                <div className="character-detail-title-stack">
                  <div className="character-detail-title-line">
                    <Typography variant="h1" as="h1" className="character-detail-title">
                      {data.character.name_ru}
                    </Typography>
                    {data.country && (
                      <span ref={nameFlagRef} className="character-detail-name-flag">
                        <Flag country={data.country} size="lg" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {parameterItems.length > 0 && <CharacterDetailFeedConveyor items={parameterItems} />}

      <SectionBreak variant="line" lineWidthClassName="width-narrow" />

      {data.character.tagline && (
        <section className="width-wide character-detail-tagline-section" aria-label="Фраза персонажа">
          <Typography variant="h2" as="p" className="tone-tertiary character-detail-tagline">
            {`«${data.character.tagline}»`}
          </Typography>
        </section>
      )}

      {data.character.tagline && <SectionBreak variant="line" lineWidthClassName="width-narrow" />}

      <section className="width-wide character-detail-content">
        <section className="character-detail-biography" aria-label="Биография персонажа">
          <Typography variant="h2" as="h2" className="character-detail-section-title">
            Биография
          </Typography>
          <MarkdownContent source={biographySource} preset="reading" className="character-detail-biography-copy" />
        </section>

        {data.quirks.length > 0 && (
          <aside className="character-detail-quirks" aria-label="Особые приметы персонажа">
            <Typography variant="h3" as="h2" className="character-detail-section-title">
              Особые приметы
            </Typography>
            <ol className="character-detail-quirks-list">
              {data.quirks.map((quirk: any) => (
                <li key={`${quirk.sort_order}-${quirk.text}`} className="character-detail-quirk-item">
                  <span className="character-detail-quirk-index role-ui tone-tertiary">
                    {String(quirk.sort_order + 1).padStart(2, "0")}
                  </span>
                  <Typography variant="body" as="p" className="character-detail-quirk-text">
                    {quirk.text}
                  </Typography>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </section>

      {data.rumors.length > 0 && (
        <>
          <SectionBreak variant="stars" />
          <section className="width-wide character-detail-rumors" aria-label="Слухи о персонаже">
            <Typography variant="h1" as="h2" className="character-detail-rumors-title">
              Что говорят другие?
            </Typography>
            <div className="character-detail-rumors-list">
              {data.rumors.map((rumor: any) => (
                <figure key={`${rumor.sort_order}-${rumor.author_name}`} className="character-detail-rumor">
                  <blockquote className="character-detail-rumor-quote">
                    <Typography variant="body" as="p" className="character-detail-rumor-text">
                      {`«${rumor.text}»`}
                    </Typography>
                  </blockquote>
                  <figcaption className="character-detail-rumor-attribution">
                    {rumor.source?.avatar_asset_path ? (
                      <Link to={rumor.source.url} className="character-detail-rumor-source-avatar">
                        <Avatar size="xs" className="character-detail-rumor-source-image">
                          <AvatarImage src={rumor.source.avatar_asset_path} alt={rumor.source.title} />
                          <AvatarFallback>{fallbackText(rumor.source.title)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : null}
                    <Typography variant="ui" as="p" className="tone-secondary character-detail-rumor-author">
                      {rumor.author_name}
                      {rumor.author_meta ? `, ${rumor.author_meta}` : ""}
                    </Typography>
                    {rumor.source && !rumor.source.avatar_asset_path && (
                      <Link to={rumor.source.url} className="character-detail-rumor-author-link ui-underline-hover">
                        {rumor.source.title}
                      </Link>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </>
      )}

      {data.episodes.length > 0 && (
        <>
          <SectionBreak variant="line" lineWidthClassName="width-narrow" />
          <section className="width-medium character-detail-episodes" aria-label="Появления в главах">
            <div className="character-detail-section-head">
              <Typography variant="h2" as="h2" className="character-detail-section-title">
                Появления в главах
              </Typography>
              <Typography variant="ui" as="p" className="tone-secondary character-detail-section-lead">
                Редакционный список глав, где персонаж влияет на события напрямую.
              </Typography>
            </div>

            <div className="character-detail-episodes-list">
              {data.episodes.map((episode: any) => {
                const episodeTitle = episode.title_native ?? episode.title_ru;
                const showRuTitle = episode.title_native && episode.title_native !== episode.title_ru;
                const readingLabel = formatReadingMinutesLabel(episode.reading_minutes);

                return (
                  <Link
                    key={episode.id}
                    to={episode.url}
                    className="character-detail-episode-row ui-underline-hover"
                    data-testid="character-detail-episode-item"
                  >
                    <div className="character-detail-episode-copy">
                      <div className="character-detail-episode-head">
                        <Typography variant="h3" as="h3" className="character-detail-episode-title">
                          {episodeTitle}
                        </Typography>
                        {showRuTitle && (
                          <Typography
                            variant="ui"
                            as="p"
                            fontRole="body"
                            className="tone-secondary character-detail-episode-title-ru"
                          >
                            {episode.title_ru}
                          </Typography>
                        )}
                      </div>

                      {episode.summary && (
                        <Typography variant="body" as="p" className="tone-secondary character-detail-episode-summary">
                          {episode.summary}
                        </Typography>
                      )}

                      <div className="character-detail-episode-meta">
                        <Flag country={episode.country} size="sm" />
                        {readingLabel && (
                          <Typography variant="ui" as="span" className="tone-secondary character-detail-episode-reading">
                            {readingLabel}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <Typography variant="h2" as="span" className="character-detail-episode-number">
                      {formatEpisodeOrder(episode.episode_number)}
                    </Typography>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {data.country && !isNameFlagVisible && (
        <div className="character-detail-floating-flag">
          <Flag country={data.country} size="md" />
        </div>
      )}
    </div>
  );
}
