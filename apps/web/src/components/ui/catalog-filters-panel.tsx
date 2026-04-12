import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

type CatalogFiltersPanelProps = {
  open: boolean;
  reduceMotion: boolean;
  children: ReactNode;
  columns?: 2 | 3;
  resetLabel?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  testId?: string;
  className?: string;
};

export function CatalogFiltersPanel({
  open,
  reduceMotion,
  children,
  columns = 3,
  resetLabel,
  onReset,
  resetDisabled = false,
  testId,
  className
}: CatalogFiltersPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: MOTION_EASE }}
          className={cn("catalog-filters-panel role-ui", className)}
          data-testid={testId}
        >
          <div
            className={cn(
              "catalog-filters-grid",
              columns === 2 && "catalog-filters-grid-columns-2"
            )}
          >
            {children}
          </div>

          {onReset && resetLabel ? (
            <button
              type="button"
              className="catalog-filters-reset tone-secondary ui-underline-hover"
              onClick={onReset}
              disabled={resetDisabled}
            >
              {resetLabel}
            </button>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
