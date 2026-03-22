import React from "react";
import { useQuery } from "@tanstack/react-query";
import { type AtlasCatalogSort } from "@aeria/shared";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { AppliedFiltersBar, Input, SectionBreak, SelectField, Typography, type AppliedFilterItem } from "@/components/ui";
import {
  AtlasCatalogFeature,
  AtlasCatalogResults,
  AtlasCatalogViewSwitch,
  atlasSectionLabels,
  atlasTypeLabels,
  buildAtlasFeatureEntry,
  type AtlasCatalogViewMode
} from "@/components/atlas";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import { getAtlasCatalog } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const DEFAULT_SORT: AtlasCatalogSort = "title_asc";
const SEARCH_DEBOUNCE_MS = 200;
const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

const sortLabels: Record<AtlasCatalogSort, string> = {
  title_asc: "Название А-Я",
  title_desc: "Название Я-А",
  recent: "Сначала новое"
};

function normalizeSort(value: string | null): AtlasCatalogSort {
  return value === "title_desc" || value === "recent" ? value : DEFAULT_SORT;
}

export default function AtlasPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<AtlasCatalogViewMode>("list");
  const [searchInput, setSearchInput] = React.useState(searchParams.get("q")?.trim() ?? "");
  const { isUnderlineActive, setIsUnderlineActive, queueUnderlineActivation, clearUnderlineActivation } =
    useUnderlineActivation();

  const qParam = searchParams.get("q")?.trim() ?? "";
  const typeParam = searchParams.get("type")?.trim() ?? "";
  const sectionParam = searchParams.get("section")?.trim() ?? "";
  const countryParam = searchParams.get("country")?.trim() ?? "";
  const locationParam = searchParams.get("location")?.trim() ?? "";
  const sortParam = normalizeSort(searchParams.get("sort"));

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

  const sourceCatalogQuery = useQuery({
    queryKey: ["atlas", "catalog-v3", "source"],
    queryFn: () =>
      getAtlasCatalog({
        page: 1,
        limit: 100,
        sort: DEFAULT_SORT
      }),
    placeholderData: (previous) => previous
  });

  const catalogQuery = useQuery({
    queryKey: ["atlas", "catalog-v3", qParam, typeParam, sectionParam, countryParam, locationParam, sortParam],
    queryFn: () =>
      getAtlasCatalog({
        page: 1,
        limit: 100,
        q: qParam || undefined,
        type: typeParam || undefined,
        section: sectionParam || undefined,
        country: countryParam || undefined,
        location: locationParam || undefined,
        sort: sortParam
      }),
    placeholderData: (previous) => previous
  });

  const items = catalogQuery.data?.items ?? [];
  const facets = catalogQuery.data?.facets;
  const sourceItems = sourceCatalogQuery.data?.items ?? items;
  const sourceFacets = sourceCatalogQuery.data?.facets ?? facets;
  const hasActiveFilters = Boolean(typeParam || sectionParam || countryParam || locationParam || sortParam !== DEFAULT_SORT);
  const hasActiveState = Boolean(qParam || hasActiveFilters);

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

  const featureEntry = React.useMemo(() => buildAtlasFeatureEntry(sourceItems), [sourceItems]);

  const clearAll = React.useCallback(() => {
    setViewMode("list");
    updateParams({ q: null, type: null, section: null, country: null, location: null, sort: null });
  }, [updateParams]);

  const activeFilters = React.useMemo(() => {
    const next: AppliedFilterItem[] = [];

    if (qParam) {
      next.push({
        key: "q",
        label: "Поиск",
        value: qParam,
        onClear: () => updateParams({ q: null })
      });
    }

    if (countryParam) {
      next.push({
        key: "country",
        label: "Страна",
        value: sourceFacets?.country.find((item) => item.slug === countryParam)?.title_ru ?? countryParam,
        onClear: () => updateParams({ country: null })
      });
    }

    if (locationParam) {
      next.push({
        key: "location",
        label: "Локация",
        value: sourceFacets?.location.find((item) => item.slug === locationParam)?.title_ru ?? locationParam,
        onClear: () => updateParams({ location: null })
      });
    }

    if (sectionParam) {
      next.push({
        key: "section",
        label: "Секция",
        value: sourceFacets?.section.find((item) => item.value === sectionParam)?.label ?? sectionParam,
        onClear: () => updateParams({ section: null })
      });
    }

    if (typeParam) {
      next.push({
        key: "type",
        label: "Тип",
        value: sourceFacets?.type.find((item) => item.value === typeParam)?.label ?? typeParam,
        onClear: () => updateParams({ type: null })
      });
    }

    if (sortParam !== DEFAULT_SORT) {
      next.push({
        key: "sort",
        label: "Сортировка",
        value: sortLabels[sortParam],
        onClear: () => updateParams({ sort: null })
      });
    }

    return next;
  }, [countryParam, locationParam, qParam, sectionParam, sortParam, sourceFacets, typeParam, updateParams]);

  return (
    <div className="page-stack atlas-catalog-page">
      {featureEntry ? (
        <>
          <section className="width-medium atlas-catalog atlas-catalog-shell">
            <AtlasCatalogFeature entry={featureEntry} />
          </section>

          <SectionBreak variant="line" lineWidthClassName="width-medium" />
        </>
      ) : null}

      <section className="width-medium atlas-catalog atlas-catalog-shell" data-testid="atlas-world-catalog">
        <div className="atlas-world-controls" aria-label="Фильтры каталога атласа">
          <div className="atlas-catalog-controls">
            <label className="atlas-catalog-search-shell" aria-label="Поиск по атласу">
              <Search size={18} className="atlas-catalog-search-icon" aria-hidden="true" />
              <Input
                appearance="ghost"
                data-testid="atlas-world-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onFocus={queueUnderlineActivation}
                onBlur={() => {
                  clearUnderlineActivation();
                  setIsUnderlineActive(false);
                }}
                placeholder="Поиск по миру..."
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

          <AppliedFiltersBar items={activeFilters} onClearAll={hasActiveState ? clearAll : undefined} />

          <div className="atlas-catalog-toolbar">
            <Typography variant="ui" as="p" className="tone-tertiary atlas-catalog-toolbar-label">
              Режим обзора
            </Typography>
            <AtlasCatalogViewSwitch value={viewMode} onChange={setViewMode} />
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
                  <SelectField
                    label="Страна"
                    value={countryParam}
                    onValueChange={(value) => updateParams({ country: value || null })}
                    options={(facets?.country ?? []).map((item) => ({ value: item.slug, label: item.title_ru }))}
                    fieldClassName="atlas-filters-field"
                    triggerClassName="atlas-filters-select"
                    triggerTestId="atlas-world-filter-country"
                  />

                  <SelectField
                    label="Локация"
                    value={locationParam}
                    onValueChange={(value) => updateParams({ location: value || null })}
                    options={(facets?.location ?? []).map((item) => ({ value: item.slug, label: item.title_ru }))}
                    fieldClassName="atlas-filters-field"
                    triggerClassName="atlas-filters-select"
                    triggerTestId="atlas-world-filter-location"
                  />

                  <SelectField
                    label="Секция"
                    value={sectionParam}
                    onValueChange={(value) => updateParams({ section: value || null })}
                    options={(facets?.section ?? []).map((item) => ({ value: item.value, label: item.label }))}
                    fieldClassName="atlas-filters-field"
                    triggerClassName="atlas-filters-select"
                    triggerTestId="atlas-world-filter-section"
                  />

                  <SelectField
                    label="Тип"
                    value={typeParam}
                    onValueChange={(value) => updateParams({ type: value || null })}
                    options={(facets?.type ?? []).map((item) => ({ value: item.value, label: item.label }))}
                    fieldClassName="atlas-filters-field"
                    triggerClassName="atlas-filters-select"
                    triggerTestId="atlas-world-filter-type"
                  />

                  <SelectField
                    label="Сортировка"
                    value={sortParam}
                    onValueChange={(value) => {
                      const nextSort = normalizeSort(value);
                      updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
                    }}
                    options={[
                      { value: "title_asc", label: "Название А-Я" },
                      { value: "title_desc", label: "Название Я-А" },
                      { value: "recent", label: "Сначала новое" }
                    ]}
                    fieldClassName="atlas-filters-field"
                    triggerClassName="atlas-filters-select"
                    triggerTestId="atlas-world-filter-sort"
                  />
                </div>

                <button
                  type="button"
                  className="atlas-filters-reset tone-secondary ui-underline-hover"
                  onClick={() => updateParams({ type: null, section: null, country: null, location: null, sort: null })}
                  disabled={!hasActiveFilters}
                >
                  Сбросить фильтры
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="atlas-catalog-list" data-testid="atlas-world-list">
          <AtlasCatalogResults
            items={items}
            viewMode={viewMode}
            showLoading={catalogQuery.isLoading && items.length === 0}
            isError={catalogQuery.isError}
            reduceMotion={reduceMotion}
            layoutTransition={layoutTransition}
            onClearAll={clearAll}
            onShowRecent={() => {
              setViewMode("list");
              updateParams({ q: null, type: null, section: null, country: null, location: null, sort: "recent" });
            }}
            onShowGeography={() => {
              setViewMode("section");
              updateParams({ q: null, type: null, section: "geography", country: null, location: null, sort: null });
            }}
            hasActiveState={hasActiveState}
          />
        </div>
      </section>
    </div>
  );
}
