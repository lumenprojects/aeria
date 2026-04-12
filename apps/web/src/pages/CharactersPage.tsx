import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CharacterSort, PaginatedCharactersResponseDTO } from "@aeria/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Flag } from "@/components/entities";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import { CharacterFactOfDaySection } from "@/components/characters/CharacterFactOfDaySection";
import { getCharacterFactOfDay, getCharacters } from "@/lib/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  CatalogFiltersPanel,
  CatalogSearchControls,
  SectionBreak,
  SelectField,
  Skeleton,
  Typography
} from "@/components/ui";

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
        <CatalogSearchControls
          searchLabel="Поиск персонажей"
          searchPlaceholder="Поиск по персонажам..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchFocus={queueUnderlineActivation}
          onSearchBlur={() => {
            clearUnderlineActivation();
            setIsUnderlineActive(false);
          }}
          isUnderlineActive={isUnderlineActive}
          filterButtonLabel="Показать фильтры персонажей"
          isFiltersOpen={isFiltersOpen}
          onToggleFilters={() => setIsFiltersOpen((value) => !value)}
          filterButtonTestId="characters-filter-button"
        />

        <CatalogFiltersPanel
          open={isFiltersOpen}
          reduceMotion={Boolean(reduceMotion)}
          resetLabel="Сбросить"
          onReset={() => updateParams({ country: null, affiliation: null, sort: null })}
          resetDisabled={!hasActiveFilters}
          testId="characters-filters-panel"
        >
          <SelectField
            label="Страна"
            value={countryParam}
            onValueChange={(value) => updateParams({ country: value || null })}
            options={countryOptions}
            fieldClassName="catalog-filters-field"
            triggerTestId="characters-filter-country"
          />

          <SelectField
            label="Принадлежность"
            value={affiliationParam}
            onValueChange={(value) => updateParams({ affiliation: value || null })}
            options={affiliationOptions}
            fieldClassName="catalog-filters-field"
            triggerTestId="characters-filter-affiliation"
          />

          <SelectField
            label="Сортировка"
            value={sortParam}
            onValueChange={(value) => {
              const nextSort = normalizeSort(value);
              updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
            }}
            options={[
              { value: "name_asc", label: "По имени (А-Я)" },
              { value: "name_desc", label: "По имени (Я-А)" }
            ]}
            fieldClassName="catalog-filters-field"
            triggerTestId="characters-filter-sort"
          />
        </CatalogFiltersPanel>

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
