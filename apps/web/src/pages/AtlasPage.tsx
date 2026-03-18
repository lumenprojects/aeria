import React from "react";
import { useQuery } from "@tanstack/react-query";
import { type AtlasCatalogSort, type WorldNodeListItemDTO, type WorldNodeType } from "@aeria/shared";
import { Search } from "lucide-react";
import { Typography, SectionBreak, Skeleton, AppliedFiltersBar, WorldNodeRow } from "@/components/ui";
import { useUnderlineActivation } from "@/components/search/useUnderlineActivation";
import { getAtlasCatalog } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const DEFAULT_SORT: AtlasCatalogSort = "title_asc";
const SEARCH_DEBOUNCE_MS = 200;
const sectionOrder: WorldNodeType[] = ["country", "location", "atlas_entry"];
const EMPTY_ITEMS: WorldNodeListItemDTO[] = [];

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function normalizeSort(value: string | null): AtlasCatalogSort {
  return value === "title_desc" || value === "recent" ? value : DEFAULT_SORT;
}

export default function AtlasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = React.useState(searchParams.get("q")?.trim() ?? "");
  const { isUnderlineActive, setIsUnderlineActive, queueUnderlineActivation, clearUnderlineActivation } =
    useUnderlineActivation();

  const qParam = searchParams.get("q")?.trim() ?? "";
  const entityParam = searchParams.get("entity")?.trim() ?? "";
  const countryParam = searchParams.get("country")?.trim() ?? "";
  const kindParam = searchParams.get("kind")?.trim() ?? "";
  const anchorParam = searchParams.get("anchor")?.trim() ?? "";
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

  const catalogQuery = useQuery({
    queryKey: ["atlas", "catalog-v2", qParam, entityParam, countryParam, kindParam, anchorParam, sortParam],
    queryFn: () =>
      getAtlasCatalog({
        page: 1,
        limit: 100,
        q: qParam || undefined,
        entity: entityParam || undefined,
        country: countryParam || undefined,
        kind: kindParam || undefined,
        anchor: anchorParam || undefined,
        sort: sortParam
      }),
    placeholderData: (previous) => previous
  });

  const items = catalogQuery.data?.items ?? EMPTY_ITEMS;
  const facets = catalogQuery.data?.facets;
  const groupedItems = React.useMemo(
    () =>
      sectionOrder.map((section) => ({
        section,
        label: facets?.entity.find((item) => item.value === section)?.label ?? section,
        items: items.filter((item) => item.node_type === section)
      })),
    [facets?.entity, items]
  );

  const activeFilters = [
    qParam ? { key: "q", label: "Поиск", value: qParam, onClear: () => updateParams({ q: null }) } : null,
    entityParam
      ? {
          key: "entity",
          label: "Сущность",
          value: facets?.entity.find((item) => item.value === entityParam)?.label ?? entityParam,
          onClear: () => updateParams({ entity: null })
        }
      : null,
    countryParam
      ? {
          key: "country",
          label: "Страна",
          value: facets?.country.find((item) => item.slug === countryParam)?.title_ru ?? countryParam,
          onClear: () => updateParams({ country: null })
        }
      : null,
    kindParam
      ? {
          key: "kind",
          label: "Слой",
          value: facets?.kind.find((item) => item.value === kindParam)?.label ?? kindParam,
          onClear: () => updateParams({ kind: null })
        }
      : null,
    anchorParam
      ? {
          key: "anchor",
          label: "Привязка",
          value: facets?.anchor.find((item) => item.value === anchorParam)?.label ?? anchorParam,
          onClear: () => updateParams({ anchor: null })
        }
      : null,
    sortParam !== DEFAULT_SORT
      ? {
          key: "sort",
          label: "Сортировка",
          value:
            sortParam === "recent"
              ? "Сначала новое"
              : sortParam === "title_desc"
                ? "Название Я-А"
                : "Название А-Я",
          onClear: () => updateParams({ sort: null })
        }
      : null
  ].filter(isDefined);

  return (
    <div className="page-stack atlas-world-page">
      <section className="width-wide atlas-world-hero" data-testid="atlas-world-catalog">
        <div className="atlas-world-hero-copy">
          <Typography variant="h1" as="h1" className="atlas-world-title">
            Атлас
          </Typography>
          <Typography variant="body" as="p" fontRole="body" className="tone-secondary atlas-world-lead">
            Единый вход в мир: страны, локации и записи атласа собраны в одном редакционном индексе, где важнее
            контекст, связи и маршрут чтения, чем сухая инвентаризация.
          </Typography>
        </div>

        <nav className="atlas-world-taxonomy" aria-label="Быстрые переходы по разделам">
          {groupedItems.map((group) => (
            <a key={group.section} href={`#atlas-group-${group.section}`} className="atlas-world-taxonomy-link ui-underline-hover">
              <span className="atlas-world-taxonomy-label">{group.label}</span>
              <span className="tone-secondary atlas-world-taxonomy-count">{group.items.length}</span>
            </a>
          ))}
        </nav>
      </section>

      <SectionBreak variant="line" lineWidthClassName="width-wide" />

      <section className="width-wide atlas-world-controls" aria-label="Фильтры каталога атласа">
        <div className="atlas-world-controls-primary">
          <label className="atlas-world-search-shell" aria-label="Поиск по атласу">
            <Search size={18} className="atlas-world-search-icon" aria-hidden="true" />
            <input
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
                "atlas-world-search-input role-ui interactive-input-underline",
                isUnderlineActive && "interactive-input-underline-active"
              )}
            />
          </label>

          <div className="atlas-world-field">
            <span className="navbar-label">Сущность</span>
            <select
              data-testid="atlas-world-filter-entity"
              className="navbar-select atlas-world-select"
              value={entityParam}
              onChange={(event) => updateParams({ entity: event.target.value || null })}
            >
              <option value="">Все</option>
              {facets?.entity.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="atlas-world-field">
            <span className="navbar-label">Страна</span>
            <select
              data-testid="atlas-world-filter-country"
              className="navbar-select atlas-world-select"
              value={countryParam}
              onChange={(event) => updateParams({ country: event.target.value || null })}
            >
              <option value="">Все</option>
              {facets?.country.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title_ru}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="atlas-world-controls-secondary">
          <div className="atlas-world-field">
            <span className="navbar-label">Слой</span>
            <select
              data-testid="atlas-world-filter-kind"
              className="navbar-select atlas-world-select"
              value={kindParam}
              onChange={(event) => updateParams({ kind: event.target.value || null })}
            >
              <option value="">Все</option>
              {facets?.kind.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="atlas-world-field">
            <span className="navbar-label">Привязка</span>
            <select
              data-testid="atlas-world-filter-anchor"
              className="navbar-select atlas-world-select"
              value={anchorParam}
              onChange={(event) => updateParams({ anchor: event.target.value || null })}
            >
              <option value="">Все</option>
              {facets?.anchor.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="atlas-world-field">
            <span className="navbar-label">Сортировка</span>
            <select
              data-testid="atlas-world-filter-sort"
              className="navbar-select atlas-world-select"
              value={sortParam}
              onChange={(event) => {
                const nextSort = normalizeSort(event.target.value);
                updateParams({ sort: nextSort === DEFAULT_SORT ? null : nextSort });
              }}
            >
              <option value="title_asc">Название А-Я</option>
              <option value="title_desc">Название Я-А</option>
              <option value="recent">Сначала новое</option>
            </select>
          </div>
        </div>
      </section>

      <AppliedFiltersBar
        className="width-wide"
        items={activeFilters}
        onClearAll={() => updateParams({ q: null, entity: null, country: null, kind: null, anchor: null, sort: null })}
      />

      <section className="width-wide atlas-world-groups" data-testid="atlas-world-list">
        {catalogQuery.isLoading && items.length === 0 && (
          <>
            <Skeleton className="world-node-row-skeleton" />
            <Skeleton className="world-node-row-skeleton" />
            <Skeleton className="world-node-row-skeleton" />
          </>
        )}

        {catalogQuery.isError && (
          <Typography variant="ui" as="p" className="tone-secondary">
            Не удалось собрать атлас. Попробуйте позже.
          </Typography>
        )}

        {!catalogQuery.isLoading && !catalogQuery.isError && items.length === 0 && (
          <Typography variant="ui" as="p" className="tone-secondary">
            Ничего не найдено. Попробуйте ослабить фильтры или изменить запрос.
          </Typography>
        )}

        {groupedItems.map((group) =>
          group.items.length > 0 ? (
            <section key={group.section} id={`atlas-group-${group.section}`} className="atlas-world-group" data-testid={`atlas-group-${group.section}`}>
              <div className="atlas-world-group-head">
                <Typography variant="h2" as="h2" className="atlas-world-group-title">
                  {group.label}
                </Typography>
                <Typography variant="ui" as="p" className="tone-secondary atlas-world-group-count">
                  {group.items.length}
                </Typography>
              </div>

              <div className="atlas-world-group-list">
                {group.items.map((item) => (
                  <WorldNodeRow key={`${item.node_type}-${item.id}`} item={item} />
                ))}
              </div>
            </section>
          ) : null
        )}
      </section>
    </div>
  );
}
