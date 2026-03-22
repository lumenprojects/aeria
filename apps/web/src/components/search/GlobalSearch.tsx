import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Typography } from "../ui/typography";
import { searchAll } from "@/lib/api";
import { useUnderlineActivation } from "./useUnderlineActivation";

type SearchHit = {
  id: string;
  type: string;
  title: string;
  summary?: string | null;
  url: string;
};

type RecentHit = SearchHit;

const RECENT_KEY = "aeria-search-recent";

function loadRecent(): RecentHit[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentHit[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.url === "string");
  } catch {
    return [];
  }
}

function saveRecent(items: RecentHit[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

export default function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [recent, setRecent] = React.useState<RecentHit[]>([]);
  const normalizedQuery = query.trim();
  const deferredQuery = React.useDeferredValue(normalizedQuery);
  const { isUnderlineActive, setIsUnderlineActive, queueUnderlineActivation, clearUnderlineActivation } =
    useUnderlineActivation();
  const labels: Record<string, string> = {
    episode: "Эпизоды",
    character: "Персонажи",
    atlas_entity: "Атлас",
    episode_series: "Серии",
    recent: "Недавнее"
  };

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", deferredQuery],
    queryFn: () => searchAll(deferredQuery),
    enabled: open && deferredQuery.length > 0,
    retry: false
  });

  React.useEffect(() => {
    setRecent(loadRecent());
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setIsUnderlineActive(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        queueUnderlineActivation();
      });
      return;
    }

    clearUnderlineActivation();
    setIsUnderlineActive(false);
    setQuery("");
  }, [clearUnderlineActivation, open, queueUnderlineActivation, setIsUnderlineActive]);

  function addRecent(hit: SearchHit) {
    const next = [hit, ...recent.filter((item) => item.url !== hit.url)].slice(0, 6);
    setRecent(next);
    saveRecent(next);
  }

  function handleSelect(hit: SearchHit) {
    addRecent(hit);
    onOpenChange(false);
    navigate(hit.url);
  }

  const groups = data?.groups?.filter((group) => group.hits.length > 0) ?? [];
  const showRecent = normalizedQuery.length === 0 && recent.length > 0;
  const showEmptyState = !isFetching && !isError && normalizedQuery.length > 0 && groups.length === 0;
  const showResultsPanel = isFetching || isError || normalizedQuery.length > 0 || showRecent;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-background"
        >
          <div className="width-wide search-inline-shell">
            <Command className="search-inline-command" shouldFilter={false}>
              <CommandInput
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                onFocus={queueUnderlineActivation}
                onBlur={() => {
                  clearUnderlineActivation();
                  setIsUnderlineActive(false);
                }}
                placeholder="Поиск по главам, персонажам и миру..."
                className={`search-inline-input interactive-input-underline text-text placeholder:text-muted${isUnderlineActive ? " interactive-input-underline-active" : ""}`}
              />
              <AnimatePresence initial={false}>
                {showResultsPanel && (
                  <motion.div
                    className="search-inline-panel"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <CommandList className="search-inline-list">
                      {isFetching && (
                        <Typography variant="ui" as="div" className="search-inline-status tone-secondary">
                          Ищем...
                        </Typography>
                      )}
                      {isError && (
                        <Typography variant="ui" as="div" className="search-inline-status tone-secondary">
                          Поиск временно недоступен. Попробуйте позже.
                        </Typography>
                      )}
                      {showEmptyState && (
                        <Typography variant="ui" as="div" className="search-inline-status role-ui tone-secondary">
                          Ничего не найдено. Попробуйте другое слово.
                        </Typography>
                      )}
                      {showRecent && (
                        <CommandGroup className="search-inline-group" heading={labels.recent}>
                          {recent.map((hit) => (
                            <CommandItem
                              key={`${hit.type}:${hit.id}`}
                              value={`${hit.type}:${hit.id}`}
                              className="search-inline-item"
                              onSelect={() => handleSelect(hit)}
                            >
                              <div className="flex flex-col">
                                <Typography variant="ui" as="span">
                                  {hit.title}
                                </Typography>
                                {hit.summary && (
                                  <Typography variant="ui" as="span" className="tone-secondary">
                                    {hit.summary}
                                  </Typography>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {groups.map((group) => (
                        <CommandGroup key={group.type} className="search-inline-group" heading={labels[group.type] ?? group.type}>
                          {group.hits.map((hit: SearchHit) => (
                            <CommandItem
                              key={`${hit.type}:${hit.id}`}
                              value={`${hit.type}:${hit.id}`}
                              className="search-inline-item"
                              onSelect={() => handleSelect(hit)}
                            >
                              <div className="flex flex-col">
                                <Typography variant="ui" as="span">
                                  {hit.title}
                                </Typography>
                                {hit.summary && (
                                  <Typography variant="ui" as="span" className="tone-secondary">
                                    {hit.summary}
                                  </Typography>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </motion.div>
                )}
              </AnimatePresence>
            </Command>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
