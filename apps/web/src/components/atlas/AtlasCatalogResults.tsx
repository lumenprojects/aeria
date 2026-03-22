import { AnimatePresence, motion } from "framer-motion";
import type { AtlasCatalogItemDTO } from "@aeria/shared";
import { AtlasEntityRow, Skeleton, Typography } from "@/components/ui";
import { buildAtlasGroups, type AtlasCatalogViewMode } from "./atlas-catalog-data";

type AtlasCatalogResultsProps = {
  items: AtlasCatalogItemDTO[];
  viewMode: AtlasCatalogViewMode;
  showLoading: boolean;
  isError: boolean;
  reduceMotion: boolean;
  layoutTransition:
    | {
        duration: number;
      }
    | {
        type: "spring";
        stiffness: number;
        damping: number;
        mass: number;
      };
  onClearAll: () => void;
  onShowRecent: () => void;
  onShowGeography: () => void;
  hasActiveState: boolean;
};

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

function AtlasCatalogEmptyState({
  onClearAll,
  onShowRecent,
  onShowGeography,
  hasActiveState
}: Pick<AtlasCatalogResultsProps, "onClearAll" | "onShowRecent" | "onShowGeography" | "hasActiveState">) {
  return (
    <div className="atlas-catalog-empty">
      <div className="atlas-catalog-empty-copy">
        <Typography variant="h3" as="h3" className="atlas-catalog-section-title">
          По этому маршруту пока пусто
        </Typography>
        <Typography variant="body" as="p" fontRole="body" className="tone-secondary">
          Можно ослабить фильтры или зайти в атлас через более живые точки входа.
        </Typography>
      </div>

      <div className="atlas-catalog-link-row atlas-catalog-empty-actions">
        {hasActiveState ? (
          <button type="button" className="atlas-catalog-inline-link ui-underline-hover" onClick={onClearAll}>
            Сбросить все
          </button>
        ) : null}
        <button type="button" className="atlas-catalog-inline-link ui-underline-hover" onClick={onShowRecent}>
          Открыть недавнее
        </button>
        <button type="button" className="atlas-catalog-inline-link ui-underline-hover" onClick={onShowGeography}>
          Показать географию
        </button>
      </div>
    </div>
  );
}

function AtlasCatalogRows({
  items,
  reduceMotion,
  layoutTransition
}: Pick<AtlasCatalogResultsProps, "items" | "reduceMotion" | "layoutTransition">) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {items.map((item) => (
        <motion.div
          key={`${item.type}-${item.id}`}
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
          <AtlasEntityRow item={item} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function AtlasCatalogResults({
  items,
  viewMode,
  showLoading,
  isError,
  reduceMotion,
  layoutTransition,
  onClearAll,
  onShowRecent,
  onShowGeography,
  hasActiveState
}: AtlasCatalogResultsProps) {
  if (showLoading) {
    return (
      <>
        <Skeleton className="atlas-catalog-skeleton-item" />
        <Skeleton className="atlas-catalog-skeleton-item" />
        <Skeleton className="atlas-catalog-skeleton-item" />
      </>
    );
  }

  if (isError) {
    return (
      <Typography variant="ui" as="p" className="tone-secondary">
        Не удалось собрать атлас. Попробуйте позже.
      </Typography>
    );
  }

  if (items.length === 0) {
    return (
      <AtlasCatalogEmptyState
        onClearAll={onClearAll}
        onShowRecent={onShowRecent}
        onShowGeography={onShowGeography}
        hasActiveState={hasActiveState}
      />
    );
  }

  const groups = buildAtlasGroups(items, viewMode);
  if (viewMode === "list") {
    return <AtlasCatalogRows items={items} reduceMotion={reduceMotion} layoutTransition={layoutTransition} />;
  }

  return (
    <div className="atlas-catalog-groups">
      {groups.map((group) => (
        <section key={group.id} className="atlas-catalog-group" data-testid="atlas-catalog-group">
          <div className="atlas-catalog-group-header">
            <div className="atlas-catalog-group-copy">
              <Typography variant="h3" as="h3" className="atlas-catalog-group-title">
                {group.title}
              </Typography>
              <Typography variant="ui" as="p" className="tone-secondary atlas-catalog-group-note">
                {group.note}
              </Typography>
            </div>

            <Typography variant="ui" as="p" className="tone-tertiary atlas-catalog-group-count">
              {group.count} сущ.
            </Typography>
          </div>

          <div className="atlas-catalog-group-list">
            <AtlasCatalogRows items={group.items} reduceMotion={reduceMotion} layoutTransition={layoutTransition} />
          </div>
        </section>
      ))}
    </div>
  );
}
