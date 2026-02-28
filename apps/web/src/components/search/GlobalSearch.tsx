import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { searchAll } from "@/lib/api";

export default function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const labels: Record<string, string> = {
    episode: "Эпизоды",
    character: "Персонажи",
    atlas_entry: "Атлас",
    episode_series: "Серии",
    country: "Страны",
    location: "Локации"
  };

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchAll(query),
    enabled: open && query.length > 0
  });

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Поиск по главам, персонажам и миру..."
          />
          <CommandList>
            {isFetching && <div className="px-3 py-2 text-sm text-muted">Ищем...</div>}
            {isError && <div className="px-3 py-2 text-sm text-muted">Поиск временно недоступен. Попробуйте позже.</div>}
            {!isFetching && query.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted">Введите запрос для поиска</div>
            )}
            <CommandEmpty>Ничего не найдено. Попробуйте другое слово.</CommandEmpty>
            {data?.groups
              ?.filter((group) => group.hits.length > 0)
              .map((group) => (
                <CommandGroup key={group.type} heading={labels[group.type] ?? group.type}>
                  {group.hits.map((hit: any) => (
                    <CommandItem
                      key={hit.id}
                      onSelect={() => {
                        onOpenChange(false);
                        navigate(hit.url);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-text">{hit.title}</span>
                        {hit.summary && <span className="text-xs text-muted">{hit.summary}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
