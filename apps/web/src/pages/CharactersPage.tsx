import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CharacterSort, PaginatedCharactersResponseDTO } from "@aeria/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Flag } from "@/components/entities";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import { CharacterFactOfDaySection } from "@/components/characters/CharacterFactOfDaySection";
import { getCharacterFactOfDay, getCharacters } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage, SectionBreak, Skeleton, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

const DEFAULT_SORT: CharacterSort = "name_asc";
const SEARCH_DEBOUNCE_MS = 200;
const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

type CharacterCatalogItem = PaginatedCharactersResponseDTO["items"][number];

function normalizeSort(value: string | null): CharacterSort {
  return value === "name_desc" ? "name_desc" : "name_asc";
}

function fallbackText(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildCountryOptions(items: CharacterCatalogItem[], selectedSlug: string) {
  const map = new Map<string, string>();
  for (const item of items) {
    if (!item.country) continue;
    map.set(item.country.slug, item.country.title_ru);
  }
  if (selectedSlug && !map.has(selectedSlug)) {
    map.set(selectedSlug, selectedSlug);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([value, label]) => ({ value, label }));
}

function buildAffiliationOptions(items: CharacterCatalogItem[], selectedSlug: string) {
  const map = new Map<string, string>();
  for (const item of items) {
    if (!item.affiliation) continue;
    map.set(item.affiliation.slug, item.affiliation.title_ru);
  }
  if (selectedSlug && !map.has(selectedSlug)) {
    map.set(selectedSlug, selectedSlug);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "ru"))
    .map(([value, label]) => ({ value, label }));
}

export default function CharactersPage() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const qParam = searchParams.get("q")?.trim() ?? "";
  const countryParam = searchParams.get("country")?.trim() ?? "";
  const affiliationParam = searchParams.get("affiliation")?.trim() ?? "";
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

  const charactersQuery = useQuery({
    queryKey: ["characters", "catalog", qParam, countryParam, affiliationParam, sortParam],
    queryFn: () =>
      getCharacters({
        page: 1,
        limit: 100,
        q: qParam || undefined,
        country: countryParam || undefined,
        affiliation: affiliationParam || undefined,
        sort: sortParam
      }),
    placeholderData: (previous) => previous
  });

  const characterFiltersSourceQuery = useQuery({
    queryKey: ["characters", "catalog", "filters-source"],
    queryFn: () => getCharacters({ page: 1, limit: 100, sort: DEFAULT_SORT })
  });

  const factOfDayQuery = useQuery({
    queryKey: ["characters", "fact-of-day"],
    queryFn: getCharacterFactOfDay,
    retry: false
  });

  const filtersSourceItems = characterFiltersSourceQuery.data?.items;
  const currentItems = charactersQuery.data?.items;
  const sourceItems = React.useMemo(() => filtersSourceItems ?? currentItems ?? [], [filtersSourceItems, currentItems]);
  const countryOptions = React.useMemo(() => buildCountryOptions(sourceItems, countryParam), [countryParam, sourceItems]);
  const affiliationOptions = React.useMemo(
    () => buildAffiliationOptions(sourceItems, affiliationParam),
    [affiliationParam, sourceItems]
  );
  const hasActiveFilters = Boolean(countryParam || affiliationParam || sortParam !== DEFAULT_SORT);
  const characters = charactersQuery.data?.items ?? [];

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
      <CharacterFactOfDaySection
        factOfDay={factOfDayQuery.data ?? null}
        isLoading={factOfDayQuery.isLoading}
        isError={factOfDayQuery.isError}
      />
      <SectionBreak variant="stars" />

      <section className="width-medium characters-catalog" data-testid="characters-catalog">
        <div className="characters-catalog-controls">
          <label className="characters-catalog-search-shell" aria-label="Поиск персонажей">
            <Search size={18} className="characters-catalog-search-icon" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onFocus={queueUnderlineActivation}
              onBlur={() => {
                clearUnderlineActivation();
                setIsUnderlineActive(false);
              }}
              placeholder="Поиск по персонажам..."
              className={cn(
                "characters-catalog-search-input role-ui interactive-input-underline",
                isUnderlineActive && "interactive-input-underline-active"
              )}
            />
          </label>

          <button
            type="button"
            aria-label="Показать фильтры персонажей"
            aria-expanded={isFiltersOpen}
            className={cn(
              "navbar-icon characters-catalog-filter-button ui-underline-click",
              isFiltersOpen && "navbar-icon-active ui-underline-active"
            )}
            onClick={() => setIsFiltersOpen((value) => !value)}
            data-testid="characters-filter-button"
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
              className="characters-filters-drawer role-ui"
              data-testid="characters-filters-panel"
            >
              <div className="characters-filters-grid">
                <div className="characters-filters-field">
                  <span className="navbar-label">Страна</span>
                  <select
                    className="navbar-select characters-filters-select"
                    value={countryParam}
                    onChange={(event) => updateParams({ country: event.target.value || null })}
                    data-testid="characters-filter-country"
                  >
                    <option value="">Все</option>
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="characters-filters-field">
                  <span className="navbar-label">Принадлежность</span>
                  <select
                    className="navbar-select characters-filters-select"
                    value={affiliationParam}
                    onChange={(event) => updateParams({ affiliation: event.target.value || null })}
                    data-testid="characters-filter-affiliation"
                  >
                    <option value="">Все</option>
                    {affiliationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="characters-filters-field">
                  <span className="navbar-label">Сортировка</span>
                  <select
                    className="navbar-select characters-filters-select"
                    value={sortParam}
                    onChange={(event) => {
                      const nextSort = normalizeSort(event.target.value);
                      updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
                    }}
                    data-testid="characters-filter-sort"
                  >
                    <option value="name_asc">По имени (А-Я)</option>
                    <option value="name_desc">По имени (Я-А)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="characters-filters-reset tone-secondary ui-underline-hover"
                onClick={() => updateParams({ country: null, affiliation: null, sort: null })}
                disabled={!hasActiveFilters}
              >
                Сбросить
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="characters-catalog-list" data-testid="characters-catalog-list">
          {charactersQuery.isLoading && characters.length === 0 && (
            <>
              <Skeleton className="characters-catalog-skeleton-item" />
              <Skeleton className="characters-catalog-skeleton-item" />
              <Skeleton className="characters-catalog-skeleton-item" />
            </>
          )}

          {charactersQuery.isError && (
            <Typography variant="ui" className="tone-secondary">
              Не удалось загрузить персонажей. Попробуйте позже.
            </Typography>
          )}

          {!charactersQuery.isLoading && !charactersQuery.isError && characters.length === 0 && (
            <Typography variant="ui" className="tone-secondary">
              Ничего не найдено. Попробуйте изменить запрос или фильтры.
            </Typography>
          )}

          <AnimatePresence initial={false} mode="popLayout">
            {characters.map((character) => (
              <motion.div
                key={character.id}
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
                <Link to={character.url} className="characters-catalog-item ui-underline-hover" data-testid="characters-catalog-item">
                  <Avatar size="md">
                    <AvatarImage src={character.avatar_asset_path} alt={character.name_ru} loading="lazy" decoding="async" />
                    <AvatarFallback>{fallbackText(character.name_ru)}</AvatarFallback>
                  </Avatar>

                  <div className="characters-catalog-item-copy">
                    <Typography variant="h2" className="characters-catalog-item-name">
                      {character.name_ru}
                    </Typography>

                    <div className="characters-catalog-item-country">
                      {character.country ? <Flag country={character.country} size="md" /> : null}
                    </div>

                    <Typography variant="body" fontRole="ui" className="tone-secondary characters-catalog-item-affiliation">
                      {character.affiliation ? character.affiliation.title_ru : "Принадлежность не указана"}
                    </Typography>
                  </div>

                  <span className="characters-catalog-item-chevron role-ui" aria-hidden="true">
                    {">"}
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
