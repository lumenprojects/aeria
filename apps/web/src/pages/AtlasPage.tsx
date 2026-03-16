import React from "react";
import { useQuery } from "@tanstack/react-query";
import { atlasKindValues, type AtlasSort, type PaginatedAtlasResponseDTO } from "@aeria/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import { SectionBreak, Skeleton, Typography } from "@/components/ui";
import { getAtlas } from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_SORT: AtlasSort = "title_asc";
const SEARCH_DEBOUNCE_MS = 200;
const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

type AtlasCatalogItem = PaginatedAtlasResponseDTO["items"][number];

const atlasKindLabels: Record<AtlasCatalogItem["kind"], string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

const atlasKindMarks: Record<AtlasCatalogItem["kind"], string> = {
  geography: "GEO",
  social: "SOC",
  history: "HIS",
  belief: "VER",
  object: "OBJ",
  event: "EVT",
  other: "OTH"
};

function normalizeSort(value: string | null): AtlasSort {
  return value === "title_desc" ? "title_desc" : DEFAULT_SORT;
}

function buildKindLegend(items: AtlasCatalogItem[]) {
  const counts = new Map<AtlasCatalogItem["kind"], number>();

  for (const kind of atlasKindValues) {
    counts.set(kind, 0);
  }

  for (const item of items) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  }

  return atlasKindValues.map((kind) => ({
    kind,
    label: atlasKindLabels[kind],
    mark: atlasKindMarks[kind],
    count: counts.get(kind) ?? 0
  }));
}

function describeAtlasEntry(item: AtlasCatalogItem) {
  if (item.location_id) return "Локальный узел";
  if (item.country_id) return "Привязка к стране";
  return "Свободная запись";
}

export default function AtlasPage() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const qParam = searchParams.get("q")?.trim() ?? "";
  const kindParam = searchParams.get("kind")?.trim() ?? "";
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

  const atlasQuery = useQuery({
    queryKey: ["atlas", "catalog", qParam, kindParam, sortParam],
    queryFn: () =>
      getAtlas({
        page: 1,
        limit: 100,
        q: qParam || undefined,
        kind: kindParam || undefined,
        sort: sortParam
      }),
    placeholderData: (previous) => previous
  });

  const atlasLegendQuery = useQuery({
    queryKey: ["atlas", "catalog", "legend"],
    queryFn: () =>
      getAtlas({
        page: 1,
        limit: 100,
        sort: DEFAULT_SORT
      })
  });

  const legendSourceItems = React.useMemo(
    () => atlasLegendQuery.data?.items ?? atlasQuery.data?.items ?? [],
    [atlasLegendQuery.data?.items, atlasQuery.data?.items]
  );
  const legendItems = React.useMemo(() => buildKindLegend(legendSourceItems), [legendSourceItems]);
  const atlasItems = atlasQuery.data?.items ?? [];
  const totalCount = atlasQuery.data?.total ?? atlasItems.length;
  const hasActiveFilters = Boolean(kindParam || sortParam !== DEFAULT_SORT);

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
      <section className="width-medium atlas-catalog" data-testid="atlas-catalog">
        <div className="atlas-catalog-head">
          <div className="atlas-catalog-intro">
            <Typography variant="h1" as="h1" className="atlas-catalog-title">
              Атлас
            </Typography>
            <Typography variant="body" fontRole="body" className="tone-secondary atlas-catalog-lead">
              Слои мира собраны как архив: география, объекты, события и социальные узлы лежат рядом, но не теряют
              своей природы.
            </Typography>
          </div>

          <div className="atlas-catalog-map" data-testid="atlas-catalog-map">
            <Typography variant="ui" as="p" className="tone-secondary atlas-catalog-map-label">
              Карта каталога
            </Typography>
            <div className="atlas-catalog-map-grid">
              {legendItems.map((item) => (
                <div key={item.kind} className="atlas-catalog-map-item">
                  <span className="atlas-catalog-map-mark" aria-hidden="true">
                    {item.mark}
                  </span>
                  <div className="atlas-catalog-map-copy">
                    <Typography variant="ui" as="p" className="atlas-catalog-map-title">
                      {item.label}
                    </Typography>
                    <Typography variant="h4" as="p" className="atlas-catalog-map-count">
                      {item.count}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
            <Typography variant="ui" as="p" className="tone-secondary atlas-catalog-map-note">
              Видимый слой: {atlasItems.length} из {totalCount}.
            </Typography>
          </div>
        </div>

        <SectionBreak variant="line" lineWidthClassName="width-medium" />

        <div className="atlas-catalog-controls">
          <label className="atlas-catalog-search-shell" aria-label="Поиск по атласу">
            <Search size={18} className="atlas-catalog-search-icon" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onFocus={queueUnderlineActivation}
              onBlur={() => {
                clearUnderlineActivation();
                setIsUnderlineActive(false);
              }}
              placeholder="Поиск по атласу..."
              className={cn(
                "atlas-catalog-search-input role-ui interactive-input-underline",
                isUnderlineActive && "interactive-input-underline-active"
              )}
            />
          </label>

          <button
            type="button"
            aria-label="Показать фильтры атласа"
            aria-expanded={isFiltersOpen}
            className={cn(
              "navbar-icon atlas-catalog-filter-button ui-underline-click",
              isFiltersOpen && "navbar-icon-active ui-underline-active"
            )}
            onClick={() => setIsFiltersOpen((value) => !value)}
            data-testid="atlas-filter-button"
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
              className="atlas-filters-drawer role-ui"
              data-testid="atlas-filters-panel"
            >
              <div className="atlas-filters-grid">
                <div className="atlas-filters-field">
                  <span className="navbar-label">Слой</span>
                  <select
                    className="navbar-select atlas-filters-select"
                    value={kindParam}
                    onChange={(event) => updateParams({ kind: event.target.value || null })}
                    data-testid="atlas-filter-kind"
                  >
                    <option value="">Все</option>
                    {atlasKindValues.map((kind) => (
                      <option key={kind} value={kind}>
                        {atlasKindLabels[kind]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="atlas-filters-field">
                  <span className="navbar-label">Порядок</span>
                  <select
                    className="navbar-select atlas-filters-select"
                    value={sortParam}
                    onChange={(event) => {
                      const nextSort = normalizeSort(event.target.value);
                      updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
                    }}
                    data-testid="atlas-filter-sort"
                  >
                    <option value="title_asc">По названию (А-Я)</option>
                    <option value="title_desc">По названию (Я-А)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="atlas-filters-reset tone-secondary ui-underline-hover"
                onClick={() => updateParams({ kind: null, sort: null })}
                disabled={!hasActiveFilters}
              >
                Сбросить фильтры
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="atlas-catalog-list" data-testid="atlas-catalog-list">
          {atlasQuery.isLoading && atlasItems.length === 0 && (
            <>
              <Skeleton className="atlas-catalog-skeleton-item" />
              <Skeleton className="atlas-catalog-skeleton-item" />
              <Skeleton className="atlas-catalog-skeleton-item" />
            </>
          )}

          {atlasQuery.isError && !atlasQuery.isLoading && (
            <Typography variant="ui" className="tone-secondary">
              Не удалось загрузить Атлас. Попробуйте позже.
            </Typography>
          )}

          {!atlasQuery.isLoading && !atlasQuery.isError && atlasItems.length === 0 && (
            <Typography variant="ui" className="tone-secondary">
              Ничего не найдено. Попробуйте изменить запрос или фильтры.
            </Typography>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {atlasItems.map((entry) => (
              <motion.div
                key={entry.id}
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
                <Link to={entry.url} className="atlas-catalog-item ui-underline-hover" data-testid="atlas-catalog-item">
                  <div className="atlas-catalog-item-sigil" aria-hidden="true">
                    <span className="atlas-catalog-item-mark">{atlasKindMarks[entry.kind]}</span>
                  </div>

                  <div className="atlas-catalog-item-copy">
                    <div className="atlas-catalog-item-head">
                      <Typography variant="h2" as="h2" className="atlas-catalog-item-title">
                        {entry.title_ru}
                      </Typography>
                      <Typography variant="ui" as="p" className="tone-secondary atlas-catalog-item-kind">
                        {atlasKindLabels[entry.kind]}
                      </Typography>
                    </div>

                    {entry.summary && (
                      <Typography variant="body" fontRole="body" className="tone-secondary atlas-catalog-item-summary">
                        {entry.summary}
                      </Typography>
                    )}

                    <div className="atlas-catalog-item-meta">
                      <Typography variant="ui" as="span" className="tone-secondary atlas-catalog-item-meta-label">
                        {describeAtlasEntry(entry)}
                      </Typography>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
