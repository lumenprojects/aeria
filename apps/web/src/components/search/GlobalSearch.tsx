import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { searchAll } from "@/lib/api";

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
  const labels: Record<string, string> = {
    episode: "Эпизоды",
    character: "Персонажи",
    atlas_entry: "Атлас",
    episode_series: "Серии",
    country: "Страны",
    location: "Локации",
    recent: "Недавнее"
  };

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchAll(query),
    enabled: open && query.length > 0
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
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    setQuery("");
  }, [open]);

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
  const showRecent = query.length === 0 && recent.length > 0;
  const showEmptyPrompt = query.length === 0 && recent.length === 0;

  if (!open) return null;

  return (
    <div className="border-b border-divider bg-background">
      <div className="container search-inline-shell">
        <Command className="bg-transparent">
          <CommandInput
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            placeholder="Поиск по главам, персонажам и миру..."
            className="border-divider text-ui text-sm text-text placeholder:text-muted focus-visible:border-accent"
          />
          <div className="search-inline-panel overflow-hidden rounded-md border border-divider bg-surface shadow-soft">
            <CommandList>
              {isFetching && <div className="search-inline-status text-sm text-muted">Ищем...</div>}
              {isError && (
                <div className="search-inline-status text-sm text-muted">Поиск временно недоступен. Попробуйте позже.</div>
              )}
              {showEmptyPrompt && <div className="search-inline-status text-sm text-muted">Введите запрос для поиска</div>}
              {query.length > 0 && <CommandEmpty>Ничего не найдено. Попробуйте другое слово.</CommandEmpty>}
              {showRecent && (
                <CommandGroup heading={labels.recent}>
                  {recent.map((hit) => (
                    <CommandItem key={`${hit.type}:${hit.id}`} onSelect={() => handleSelect(hit)}>
                      <div className="flex flex-col">
                        <span className="text-sm text-text">{hit.title}</span>
                        {hit.summary && <span className="text-xs text-muted">{hit.summary}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {groups.map((group) => (
                <CommandGroup key={group.type} heading={labels[group.type] ?? group.type}>
                  {group.hits.map((hit: SearchHit) => (
                    <CommandItem key={hit.id} onSelect={() => handleSelect(hit)}>
                      <div className="flex flex-col">
                        <span className="text-sm text-text">{hit.title}</span>
                        {hit.summary && <span className="text-xs text-muted">{hit.summary}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </div>
        </Command>
      </div>
    </div>
  );
}
