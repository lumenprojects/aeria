import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CharacterSort, PaginatedCharactersResponseDTO, PaginatedEpisodesResponseDTO } from "@aeria/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { LatestEpisode } from "@/components/home/LatestEpisode";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  SectionBreak,
  SelectField,
  Skeleton,
  Typography
} from "@/components/ui";
import { getCharacters, getEpisodes, getHomeSnapshot, getSeries, getSeriesList } from "@/lib/api";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 200;
const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
const DEFAULT_SORT = "newest" as const;

type EpisodeCatalogItem = PaginatedEpisodesResponseDTO["items"][number];
type CharacterFilterItem = PaginatedCharactersResponseDTO["items"][number];

function normalizeSort(value: string | null) {
  return value === "oldest" ? "oldest" : DEFAULT_SORT;
}

function buildCharacterOptions(items: CharacterFilterItem[], selectedSlug: string) {
  const map = new Map<string, string>();

  for (const item of items) {
    map.set(item.slug, item.name_ru);
  }

  if (selectedSlug && !map.has(selectedSlug)) {
    map.set(selectedSlug, selectedSlug);
  }

  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([value, label]) => ({ value, label }));
}

function buildSeriesOptions(
  items: Array<{ slug: string; title_ru: string }>,
  selectedSlug: string
) {
  const map = new Map<string, string>();

  for (const item of items) {
    map.set(item.slug, item.title_ru);
  }

  if (selectedSlug && !map.has(selectedSlug)) {
    map.set(selectedSlug, selectedSlug);
  }

  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([value, label]) => ({ value, label }));
}

function matchesEpisodeSearch(item: EpisodeCatalogItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    item.title_ru,
    item.title_native ?? "",
    item.summary ?? "",
    String(item.episode_number),
    String(item.global_order)
  ].some((value) => value.toLowerCase().includes(query));
}

function formatOrder(value: number) {
  return String(value).padStart(2, "0");
}

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

function formatEpisodeCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} эпизод`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} эпизода`;
  }

  return `${count} эпизодов`;
}

export default function EpisodesPage() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const qParam = searchParams.get("q")?.trim() ?? "";
  const characterParam = searchParams.get("character")?.trim() ?? "";
  const seriesParam = searchParams.get("series")?.trim() ?? "";
  const sortParam = normalizeSort(searchParams.get("sort"));
  const [searchInput, setSearchInput] = React.useState(qParam);
  const { isUnderlineActive, setIsUnderlineActive, queueUnderlineActivation, clearUnderlineActivation } =
    useUnderlineActivation();

  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(updates)) {
            if (!value) {
              next.delete(key);
              continue;
            }

            next.set(key, value);
          }

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  React.useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  React.useEffect(() => {
    if (searchInput === qParam) return;

    const timerId = window.setTimeout(() => {
      updateParams({ q: searchInput.trim() || null });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [qParam, searchInput, updateParams]);

  const episodesQuery = useQuery({
    queryKey: ["episodes", "catalog", characterParam, seriesParam, sortParam],
    queryFn: () =>
      getEpisodes({
        page: 1,
        limit: 100,
        character: characterParam || undefined,
        series: seriesParam || undefined,
        sort: sortParam
      }),
    placeholderData: (previous) => previous
  });

  const latestEpisodeQuery = useQuery({
    queryKey: ["home", "latest-episode"],
    queryFn: getHomeSnapshot
  });

  const charactersListQuery = useQuery({
    queryKey: ["characters", "catalog", "filters-source"],
    queryFn: () => getCharacters({ page: 1, limit: 100, sort: "name_asc" as CharacterSort })
  });

  const seriesListQuery = useQuery({
    queryKey: ["series", "list"],
    queryFn: () => getSeriesList({ page: 1, limit: 100 })
  });

  const activeSeriesQuery = useQuery({
    queryKey: ["series", "detail", seriesParam],
    queryFn: () => getSeries(seriesParam),
    enabled: Boolean(seriesParam)
  });

  const characterOptions = React.useMemo(
    () => buildCharacterOptions(charactersListQuery.data?.items ?? [], characterParam),
    [characterParam, charactersListQuery.data?.items]
  );
  const seriesOptions = React.useMemo(
    () => buildSeriesOptions(seriesListQuery.data?.items ?? [], seriesParam),
    [seriesListQuery.data?.items, seriesParam]
  );
  const seriesById = React.useMemo(
    () => new Map((seriesListQuery.data?.items ?? []).map((series) => [series.id, series])),
    [seriesListQuery.data?.items]
  );
  const episodes = React.useMemo(
    () => (episodesQuery.data?.items ?? []).filter((item) => matchesEpisodeSearch(item, qParam)),
    [episodesQuery.data?.items, qParam]
  );
  const hasActiveFilters = Boolean(characterParam || seriesParam || sortParam !== DEFAULT_SORT);
  const activeSeries = activeSeriesQuery.data?.series ?? null;
  const activeSeriesTitle =
    activeSeries?.title_ru ??
    seriesOptions.find((option) => option.value === seriesParam)?.label ??
    seriesParam;
  const activeSeriesSummary =
    activeSeries?.summary ??
    "Серия объединяет несколько близких по ритму и направлению глав, чтобы их было удобно читать как одну линию.";
  const activeSeriesEpisodeCount = activeSeriesQuery.data?.episodes.length ?? null;
  const hasSecondarySeriesFilters = Boolean(qParam || characterParam || sortParam !== DEFAULT_SORT);
  const activeSeriesColor = activeSeries?.brand_color ?? "var(--accent)";

  const layoutTransition = React.useMemo(
    () =>
      reduceMotion
        ? { duration: 0 }
        : ({
            type: "spring",
            stiffness: 110,
            damping: 18,
            mass: 0.8
          } as const),
    [reduceMotion]
  );

  return (
    <div className="page-stack">
      <section className="width-wide episodes-catalog-release" data-testid="episodes-latest-release">
        <Typography variant="h1" as="h1" className="episodes-catalog-release-title">
          Самый свежий <em>Эпизод</em>
        </Typography>

        <LatestEpisode
          episode={latestEpisodeQuery.data?.latest_episode ?? null}
          titleAs="h2"
          subtitleAs="h3"
          emptyStateTitle={null}
          isLoading={latestEpisodeQuery.isLoading}
        />
      </section>

      <section className="width-medium episodes-catalog" data-testid="episodes-catalog">
        <section className="home-faq" data-testid="episodes-faq">
          <Accordion type="single" collapsible className="width-medium">
            <AccordionItem value="episodes-1">
              <AccordionTrigger className="home-faq-trigger role-heading type-h2">
                Что такое <em>Эпизоды</em>?
              </AccordionTrigger>
              <AccordionContent className="home-faq-content">
                <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
                  Это отдельные главы истории: самостоятельные точки входа в мир, которые можно читать по одной или
                  собирать в более длинную дугу.
                </Typography>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="episodes-2">
              <AccordionTrigger className="home-faq-trigger role-heading type-h2">
                А что значит <em>Серия Эпизодов</em>?
              </AccordionTrigger>
              <AccordionContent className="home-faq-content">
                <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
                  Это связка нескольких глав с общим ритмом, темой или направлением сюжета. Серия помогает читать не
                  только по отдельным эпизодам, но и по более крупной линии.
                </Typography>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="episodes-3">
              <AccordionTrigger className="home-faq-trigger role-heading type-h2">
                Почему номера эпизодов иногда совпадают?
              </AccordionTrigger>
              <AccordionContent className="home-faq-content">
                <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
                  Потому что у главы может быть свой номер внутри конкретной серии и отдельный порядок внутри общего
                  каталога. Поэтому совпадение номера не всегда значит, что это один и тот же выпуск.
                </Typography>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {seriesParam && (
          <section
            className="episodes-series-context"
            data-testid="episodes-series-context"
            aria-label={`Контекст серии ${activeSeriesTitle}`}
          >
            <div className="episodes-series-context-head">
              <div className="episodes-series-context-kicker">
                <span
                  className="episodes-series-context-dot"
                  style={{ backgroundColor: activeSeriesColor }}
                  aria-hidden="true"
                />
                <Typography variant="ui" as="p" className="tone-tertiary">
                  Серия
                </Typography>
              </div>

              <button
                type="button"
                className="episodes-series-context-reset tone-secondary ui-underline-hover"
                onClick={() => updateParams({ series: null })}
              >
                Показать весь каталог
              </button>
            </div>

            <Typography variant="h2" as="h2" className="episodes-series-context-title">
              {activeSeriesTitle}
            </Typography>

            <Typography variant="body" fontRole="body" className="tone-secondary episodes-series-context-summary">
              {activeSeriesSummary}
            </Typography>

            <div className="episodes-series-context-meta">
              {activeSeriesEpisodeCount !== null && (
                <Typography variant="ui" as="p" className="tone-secondary episodes-series-context-note">
                  {`В серии ${formatEpisodeCountLabel(activeSeriesEpisodeCount)}`}
                </Typography>
              )}

              {hasSecondarySeriesFilters && (
                <Typography variant="ui" as="p" className="tone-secondary episodes-series-context-note">
                  Ниже список дополнительно сужен поиском или фильтрами.
                </Typography>
              )}
            </div>
          </section>
        )}

        <div className="episodes-catalog-controls">
          <label className="episodes-catalog-search-shell" aria-label="Поиск эпизодов">
            <Search size={18} className="episodes-catalog-search-icon" aria-hidden="true" />
            <Input
              appearance="ghost"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onFocus={queueUnderlineActivation}
              onBlur={() => {
                clearUnderlineActivation();
                setIsUnderlineActive(false);
              }}
              placeholder="Поиск по главам..."
              className={cn(
                "episodes-catalog-search-input role-ui interactive-input-underline",
                isUnderlineActive && "interactive-input-underline-active"
              )}
            />
          </label>

          <button
            type="button"
            aria-label="Показать фильтры эпизодов"
            aria-expanded={isFiltersOpen}
            className={cn(
              "navbar-icon episodes-catalog-filter-button ui-underline-click",
              isFiltersOpen && "navbar-icon-active ui-underline-active"
            )}
            onClick={() => setIsFiltersOpen((value) => !value)}
            data-testid="episodes-filter-button"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isFiltersOpen && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: MOTION_EASE }}
              className="episodes-filters-drawer role-ui"
              data-testid="episodes-filters-panel"
            >
              <div className="episodes-filters-grid">
                <SelectField
                  label="Персонаж"
                  value={characterParam}
                  onValueChange={(value) => updateParams({ character: value || null })}
                  options={characterOptions}
                  fieldClassName="episodes-filters-field"
                  triggerClassName="episodes-filters-select"
                  triggerTestId="episodes-filter-character"
                />

                <SelectField
                  label="Серия"
                  value={seriesParam}
                  onValueChange={(value) => updateParams({ series: value || null })}
                  options={seriesOptions}
                  fieldClassName="episodes-filters-field"
                  triggerClassName="episodes-filters-select"
                  triggerTestId="episodes-filter-series"
                />

                <SelectField
                  label="Порядок"
                  value={sortParam}
                  onValueChange={(value) => {
                    const nextSort = normalizeSort(value);
                    updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
                  }}
                  options={[
                    { value: "oldest", label: "Старые -> новые" },
                    { value: "newest", label: "Новые -> старые" }
                  ]}
                  fieldClassName="episodes-filters-field"
                  triggerClassName="episodes-filters-select"
                  triggerTestId="episodes-filter-sort"
                />
              </div>

              <button
                type="button"
                className="episodes-filters-reset tone-secondary ui-underline-hover"
                onClick={() => updateParams({ character: null, series: null, sort: null })}
                disabled={!hasActiveFilters}
              >
                Сбросить фильтры
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="episodes-catalog-list" data-testid="episodes-catalog-list">
          {episodesQuery.isLoading && episodes.length === 0 && (
            <>
              <Skeleton className="episodes-catalog-skeleton-item" />
              <Skeleton className="episodes-catalog-skeleton-item" />
              <Skeleton className="episodes-catalog-skeleton-item" />
            </>
          )}

          {episodesQuery.isError && !episodesQuery.isLoading && (
            <Typography variant="ui" className="tone-secondary">
              Не удалось загрузить список эпизодов. Попробуйте позже.
            </Typography>
          )}

          {!episodesQuery.isLoading && !episodesQuery.isError && episodes.length === 0 && (
            <Typography variant="ui" className="tone-secondary">
              Ничего не найдено. Попробуйте изменить запрос или фильтры.
            </Typography>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {episodes.map((episode) => {
              const readingLabel = formatReadingMinutesLabel(episode.reading_minutes);
              const episodeSeries = seriesById.get(episode.series_id) ?? null;
              const participants = episode.participants;
              const seriesColor = episodeSeries?.brand_color ?? "var(--accent)";

              return (
                <motion.div
                  key={episode.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          opacity: { duration: 0.2, ease: MOTION_EASE },
                          y: { duration: 0.22, ease: MOTION_EASE },
                          layout: layoutTransition
                        }
                  }
                >
                  <Link to={episode.url} className="episodes-catalog-item ui-underline-hover" data-testid="episodes-catalog-item">
                    <div className="episodes-catalog-item-copy">
                      <div className="episodes-catalog-item-header">
                        <div className="episodes-catalog-item-heading">
                          <Typography variant="h1" as="h2" className="episodes-catalog-item-title">
                            {episode.title_ru}
                          </Typography>

                          {participants.length > 0 && (
                            <div className="episodes-catalog-item-participants" aria-label="Участники главы">
                              {participants.map((participant) => (
                                <span
                                  key={participant.id}
                                  className="episodes-catalog-item-avatar-link"
                                  title={participant.name_ru}
                                >
                                  <Avatar size="sm" className="episodes-catalog-item-avatar">
                                    <AvatarImage
                                      src={participant.avatar_asset_path}
                                      alt={participant.name_ru}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                    <AvatarFallback>{fallbackText(participant.name_ru)}</AvatarFallback>
                                  </Avatar>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Typography variant="h1" as="p" className="episodes-catalog-item-number">
                          {formatOrder(episode.episode_number)}
                        </Typography>
                      </div>

                      {episode.summary && (
                        <Typography variant="body" fontRole="body" className="tone-secondary episodes-catalog-item-summary">
                          {episode.summary}
                        </Typography>
                      )}

                      <div className="episodes-catalog-item-footer">
                        {episodeSeries && (
                          <div className="episodes-catalog-item-series">
                            <span
                              className="episodes-catalog-item-series-dot"
                              style={{ backgroundColor: seriesColor }}
                              aria-hidden="true"
                            />
                            <Typography variant="ui" as="p" className="tone-secondary episodes-catalog-item-series-label">
                              {episodeSeries.title_ru}
                            </Typography>
                          </div>
                        )}

                        {readingLabel && (
                          <Typography variant="ui" as="span" className="tone-secondary episodes-catalog-item-reading">
                            {readingLabel}
                          </Typography>
                        )}
                      </div>
                    </div>

                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
