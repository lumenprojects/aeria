import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { AtlasDetailResponseDTO, AtlasResolvedRelationDTO } from "@aeria/shared";
import { EntityAvatar, Flag } from "@/components/entities";
import {
  ArticleOutline,
  EntityFactStrip,
  MarkdownContent,
  SectionBreak,
  Typography,
  extractMarkdownHeadings
} from "@/components/ui";
import { getAtlasEntry } from "@/lib/api";

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

const kindLabels: Record<AtlasDetailResponseDTO["entry"]["kind"], string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const nodeTypeLabels: Record<AtlasDetailResponseDTO["node_type"], string> = {
  country: "World node / Страна",
  location: "World node / Локация",
  atlas_entry: "Запись атласа"
};

const relationTypeLabels: Record<AtlasResolvedRelationDTO["to_type"], string> = {
  episode: "Главы",
  character: "Персонажи",
  atlas_entry: "Записи атласа",
  episode_series: "Серии",
  country: "Страны",
  location: "Локации"
};

function formatPublishedDate(value: string | null) {
  if (!value) return "Черновой узел";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

function describeAnchor(data: AtlasDetailResponseDTO) {
  if (data.node_type === "country") return "Страновой узел";
  if (data.node_type === "location") return "Локальный узел";
  if (data.location) return `Локация / ${data.location.title_ru}`;
  if (data.country) return `Страна / ${data.country.title_ru}`;
  return "Свободная запись";
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

function getFactHeading(data: AtlasDetailResponseDTO) {
  if (data.node_type === "country" || data.node_type === "location") return "Примета места";

  switch (data.entry.kind) {
    case "geography":
      return "Примета места";
    case "history":
    case "event":
      return "Историческая заметка";
    case "belief":
      return "Обычай или поверье";
    case "social":
    case "object":
    case "other":
      return "Интересный факт";
  }
}

function getSigilMark(data: AtlasDetailResponseDTO) {
  if (data.node_type === "atlas_entry") {
    return kindLabels[data.entry.kind].slice(0, 3).toUpperCase();
  }

  return data.node_type.slice(0, 3).toUpperCase();
}

export default function AtlasDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["atlas", "detail-v2", slug],
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
          Собираем связи, факт и основной текст узла.
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

  if (!data) return null;

  const markdownHeadings = extractMarkdownHeadings(data.entry.content_markdown || "").filter(
    (heading, index) => !(index === 0 && heading.level === 1)
  );
  const groupedRelations = groupRelations(data.relations ?? []);
  const factItems = [
    { key: "node-type", label: "Сущность", value: nodeTypeLabels[data.node_type] },
    { key: "kind", label: "Тип", value: kindLabels[data.entry.kind] },
    { key: "anchor", label: "Привязка", value: describeAnchor(data) },
    data.country && data.node_type !== "country"
      ? { key: "country", label: "Страна", value: data.country.title_ru, href: data.country.url }
      : null,
    data.location && data.node_type !== "location"
      ? { key: "location", label: "Локация", value: data.location.title_ru, href: data.location.url }
      : null,
    { key: "published", label: "Дата", value: formatPublishedDate(data.entry.published_at) },
    { key: "relations", label: "Связи", value: String((data.relations ?? []).length) }
  ].filter(isDefined);

  return (
    <div className="page-stack atlas-article-page" data-testid="atlas-detail-page">
      <section className="width-wide atlas-article-hero" aria-label={`Узел атласа ${data.entry.title_ru}`}>
        <div className="atlas-article-hero-copy">
          <div className="atlas-article-kicker">
            <Typography variant="ui" as="p" className="tone-tertiary atlas-article-kicker-label">
              {nodeTypeLabels[data.node_type]}
            </Typography>
            <Typography variant="ui" as="p" className="tone-secondary atlas-article-kicker-kind">
              {kindLabels[data.entry.kind]}
            </Typography>
            {data.country ? <Flag country={data.country} size="md" className="atlas-article-kicker-flag" /> : null}
          </div>

          <Typography variant="h1" as="h1" className="atlas-article-title">
            {data.entry.title_ru}
          </Typography>

          {data.entry.summary && (
            <Typography variant="h3" as="p" fontRole="body" className="tone-secondary atlas-article-summary">
              {data.entry.summary}
            </Typography>
          )}
        </div>

        <div className="atlas-article-sigil" aria-hidden="true">
          {data.node_type === "country" && data.country ? (
            <Flag country={data.country} size="xl" className="atlas-article-sigil-flag" />
          ) : data.entry.avatar_asset_path ? (
            <img src={data.entry.avatar_asset_path} alt="" className="atlas-article-image" loading="lazy" decoding="async" />
          ) : (
            <span className="atlas-article-sigil-mark">{getSigilMark(data)}</span>
          )}
        </div>
      </section>

      <EntityFactStrip className="width-wide" items={factItems} />

      <SectionBreak variant="line" lineWidthClassName="width-wide" />

      <section className="width-wide atlas-article-content">
        <div className="atlas-article-main">
          {markdownHeadings.length > 1 && <ArticleOutline items={markdownHeadings} className="atlas-article-outline" />}

          <section className="atlas-article-reading" aria-label="Текст записи">
            <Typography variant="h2" as="h2" className="atlas-article-section-title">
              Запись
            </Typography>
            <MarkdownContent source={data.entry.content_markdown || ""} preset="reading" className="atlas-article-reading-copy" />
          </section>

          {data.fact ? (
            <section className="atlas-article-fact" aria-label={getFactHeading(data)} data-testid="atlas-detail-fact">
              <Typography variant="h2" as="h2" className="atlas-article-section-title">
                {getFactHeading(data)}
              </Typography>

              <article className="atlas-article-fact-block">
                <Typography variant="h4" as="h3" className="atlas-article-fact-title">
                  {data.fact.title}
                </Typography>
                <Typography variant="body" as="p" className="atlas-article-fact-text">
                  {data.fact.text}
                </Typography>
                {data.fact.meta ? (
                  <Typography variant="ui" as="p" className="tone-secondary atlas-article-fact-meta">
                    {data.fact.meta}
                  </Typography>
                ) : null}
              </article>
            </section>
          ) : null}

          {data.quotes.length > 0 ? (
            <section className="atlas-article-quotes" aria-label="Что говорят" data-testid="atlas-detail-quotes">
              <Typography variant="h2" as="h2" className="atlas-article-section-title">
                Что говорят
              </Typography>

              <div className="atlas-article-quotes-list">
                {data.quotes.map((quote) => (
                  <figure key={quote.id} className="atlas-article-quote-card">
                    <blockquote className="atlas-article-quote-text">
                      <Typography variant="body" as="p" className="atlas-article-quote-copy">
                        {quote.text}
                      </Typography>
                    </blockquote>

                    <figcaption className="atlas-article-quote-footer">
                      {quote.character ? (
                        <EntityAvatar
                          entityType="character"
                          entitySlug={quote.character.slug}
                          imageSrc={quote.character.avatar_asset_path}
                          label={quote.character.name_ru}
                          ariaLabel={`Открыть персонажа ${quote.character.name_ru}`}
                          size="sm"
                          className="atlas-article-quote-avatar-link"
                          avatarClassName="atlas-article-quote-avatar"
                        />
                      ) : null}

                      <div className="atlas-article-quote-source">
                        {quote.character ? (
                          <Link to={quote.character.url} className="ui-underline-hover atlas-article-quote-speaker-link">
                            <Typography variant="ui" as="span" className="atlas-article-quote-speaker">
                              {quote.speaker_name}
                            </Typography>
                          </Link>
                        ) : (
                          <Typography variant="ui" as="p" className="atlas-article-quote-speaker">
                            {quote.speaker_name}
                          </Typography>
                        )}

                        {quote.speaker_meta ? (
                          <Typography variant="ui" as="p" className="tone-secondary atlas-article-quote-meta">
                            {quote.speaker_meta}
                          </Typography>
                        ) : null}
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section className="atlas-article-relations" aria-label="Связи" data-testid="atlas-detail-relations">
            <Typography variant="h2" as="h2" className="atlas-article-section-title">
              Связи
            </Typography>

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
                            <div className="atlas-article-relation-row-copy">
                              <Typography variant="h4" as="p" className="atlas-article-relation-title">
                                {relation.label ?? relation.target.title}
                              </Typography>
                              <Typography variant="ui" as="p" className="tone-secondary atlas-article-relation-meta">
                                {relation.target.title}
                              </Typography>
                            </div>

                            <div className="atlas-article-relation-row-side">
                              {relation.target.country ? (
                                <Flag country={relation.target.country} size="sm" className="atlas-article-relation-flag" />
                              ) : null}
                              <Typography variant="ui" as="span" className="atlas-article-relation-arrow" aria-hidden="true">
                                &gt;
                              </Typography>
                            </div>
                          </Link>
                        ) : (
                          <div key={`${relation.to_type}-${relation.to_id}`} className="atlas-article-relation-row">
                            <div className="atlas-article-relation-row-copy">
                              <Typography variant="h4" as="p" className="atlas-article-relation-title">
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
          </section>
        </div>

        {markdownHeadings.length > 1 ? (
          <aside className="atlas-article-aside" aria-label="Быстрая навигация по записи">
            <ArticleOutline items={markdownHeadings} compact className="atlas-article-outline-compact" />
          </aside>
        ) : null}
      </section>
    </div>
  );
}
