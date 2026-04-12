import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { AtlasEntityType, AtlasResolvedRelationDTO, AtlasSection } from "@aeria/shared";
import { Flag } from "@/components/entities";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  EditorialQuoteCard,
  MarkdownContent,
  SectionBreak,
  Typography,
} from "@/components/ui";
import { getAtlasEntry } from "@/lib/api";

const sectionLabels: Record<AtlasSection, string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const typeLabels: Record<AtlasEntityType, string> = {
  country: "Страны",
  location: "Локации",
  organization: "Организации",
  object: "Объекты",
  event: "События",
  belief: "Верования",
  concept: "Понятия",
  other: "Другое"
};

const relationTypeLabels: Record<AtlasResolvedRelationDTO["to_type"], string> = {
  episode: "Главы",
  character: "Персонажи",
  atlas_entity: "Мир",
  episode_series: "Серии"
};

function stripLeadingMarkdownTitle(source: string) {
  return source.replace(/^\s*#\s+.+?(?:\r?\n){1,2}/, "");
}

function groupRelations(relations: AtlasResolvedRelationDTO[]) {
  const groups = new Map<AtlasResolvedRelationDTO["to_type"], AtlasResolvedRelationDTO[]>();
  for (const relation of relations) {
    const bucket = groups.get(relation.to_type) ?? [];
    bucket.push(relation);
    groups.set(relation.to_type, bucket);
  }
  return [...groups.entries()];
}

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AtlasDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["atlas", "detail-v3", slug],
    queryFn: () => getAtlasEntry(slug || ""),
    enabled: Boolean(slug),
    retry: false
  });

  if (isLoading) {
    return (
      <section className="width-wide page-stack" aria-busy="true">
        <Typography variant="h2" as="h1">
          Загружаем запись атласа
        </Typography>
        <Typography variant="body" as="p" className="tone-secondary">
          Собираем секции, связи и основной текст узла.
        </Typography>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="width-wide page-stack" data-testid="atlas-detail-error">
        <Typography variant="h2" as="h1">
          Не удалось загрузить запись атласа
        </Typography>
        <Typography variant="body" as="p" className="tone-secondary">
          {error instanceof Error ? error.message : "Попробуйте обновить страницу через несколько секунд."}
        </Typography>
      </section>
    );
  }

  if (!data?.entity) return null;

  const groupedRelations = groupRelations(data.relations ?? []);
  const readingSource = stripLeadingMarkdownTitle(data.entity.overview_markdown ?? "");

  return (
    <div className="page-stack atlas-article-page" data-testid="atlas-detail-page">
      <section className="width-wide atlas-article-hero" aria-label={`Узел атласа ${data.entity.title_ru}`}>
        <div className="atlas-article-hero-copy">
          <Typography variant="h1" as="h1" className="atlas-article-title">
            {data.entity.title_ru}
          </Typography>

          {data.entity.country ? <Flag country={data.entity.country} size="lg" className="atlas-article-hero-flag" /> : null}

          <Typography variant="ui" as="p" className="tone-secondary atlas-article-summary">
            {typeLabels[data.entity.type]}
          </Typography>

          {data.entity.summary && (
            <Typography variant="h3" as="p" fontRole="body" className="tone-secondary atlas-article-summary">
              {data.entity.summary}
            </Typography>
          )}
        </div>
      </section>

      {readingSource ? (
        <section className="width-wide atlas-article-content">
          <section className="atlas-article-reading" aria-label="Описание" data-testid="atlas-detail-description">
            <Typography variant="h2" as="h2" className="atlas-article-section-title">
              Описание
            </Typography>
            <MarkdownContent source={readingSource} preset="reading" className="atlas-article-reading-copy" />
          </section>
        </section>
      ) : null}

      {data.sections.length > 0 ? (
        <>
          <SectionBreak variant="line" lineWidthClassName="width-narrow" />
          <section className="width-wide page-stack" data-testid="atlas-detail-sections">
            {data.sections.map((section) => (
              <article key={section.section} className="page-stack">
                <div className="atlas-article-section-head">
                  <Typography variant="h2" as="h2" className="atlas-article-section-title">
                    {section.title_ru || sectionLabels[section.section]}
                  </Typography>
                  {section.summary ? (
                    <Typography variant="body" as="p" className="tone-secondary">
                      {section.summary}
                    </Typography>
                  ) : null}
                </div>

                {section.body_markdown ? (
                  <MarkdownContent source={section.body_markdown} preset="reading" className="atlas-article-reading-copy" />
                ) : null}

                {section.quotes.length > 0 ? (
                  <div className="atlas-article-quotes-list" data-testid="atlas-detail-quotes">
                    {section.quotes.map((quote) => (
                      <EditorialQuoteCard
                        key={`${section.section}-${quote.id}`}
                        text={quote.text}
                        speaker={quote.speaker_name}
                        speakerMeta={quote.speaker_meta}
                        speakerHref={quote.character?.url}
                        avatarSrc={quote.character?.avatar_asset_path}
                        avatarLabel={quote.character?.name_ru}
                        avatarHref={quote.character?.url}
                      />
                    ))}
                  </div>
                ) : null}

                {section.fact ? (
                  <div className="home-heard atlas-article-fact-heard" data-testid="atlas-detail-fact">
                    <div className="home-heard-copy atlas-article-fact-copy">
                      <Typography variant="h1" fontRole="body" as="blockquote" className="home-heard-quote atlas-article-fact-text">
                        {`« ${section.fact.text} »`}
                      </Typography>

                      <Typography variant="body" as="p" className="home-heard-source atlas-article-fact-title">
                        {section.fact.title}
                      </Typography>

                      {section.fact.meta ? (
                        <Typography variant="ui" as="p" className="tone-secondary atlas-article-fact-meta">
                          {section.fact.meta}
                        </Typography>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        </>
      ) : null}

      <SectionBreak variant="stars" />

      <section className="width-narrow atlas-article-relations-shell" aria-label="Связи">
        <Typography variant="h1" as="h2" className="atlas-article-relations-heading">
          <em>Связи</em>
        </Typography>

        <div className="atlas-article-relations" data-testid="atlas-detail-relations">
          {groupedRelations.length > 0 ? (
            <div className="atlas-article-relation-groups">
              {groupedRelations.map(([type, relations]) => (
                <section key={type} className="atlas-article-relation-group">
                  <Typography variant="h4" as="h3" className="atlas-article-relation-group-title">
                    {relationTypeLabels[type]}
                  </Typography>

                  <div className="atlas-article-relation-group-list" data-testid="atlas-detail-relations-list">
                    {relations.map((relation) =>
                      relation.target ? (
                        <Link
                          key={`${relation.to_type}-${relation.to_id}`}
                          to={relation.target.url}
                          className="atlas-article-relation-row ui-underline-hover"
                        >
                          {relation.target.avatar_asset_path ? (
                            <Avatar size="md" className="atlas-article-relation-avatar">
                              <AvatarImage
                                src={relation.target.avatar_asset_path}
                                alt={relation.target.title}
                                loading="lazy"
                                decoding="async"
                              />
                              <AvatarFallback>{fallbackText(relation.target.title)}</AvatarFallback>
                            </Avatar>
                          ) : null}

                          <div className="atlas-article-relation-row-copy">
                            <Typography variant="h2" as="p" className="atlas-article-relation-title">
                              {relation.label ?? relation.target.title}
                            </Typography>

                            {relation.target.country ? (
                              <Flag country={relation.target.country} size="sm" className="atlas-article-relation-meta-flag" />
                            ) : null}
                          </div>

                          <div className="atlas-article-relation-row-side">
                            <Typography variant="ui" as="span" className="atlas-article-relation-arrow" aria-hidden="true">
                              &gt;
                            </Typography>
                          </div>
                        </Link>
                      ) : (
                        <div key={`${relation.to_type}-${relation.to_id}`} className="atlas-article-relation-row">
                          <div className="atlas-article-relation-row-copy">
                            <Typography variant="h2" as="p" className="atlas-article-relation-title">
                              {relation.label ?? "Связь без подписи"}
                            </Typography>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <Typography variant="body" as="p" className="tone-secondary atlas-article-relations-empty">
              Для этого узла пока не вынесены явные связи.
            </Typography>
          )}
        </div>
      </section>
    </div>
  );
}
