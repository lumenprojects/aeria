import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useTheme, themePresets } from "@/lib/theme";
import GlobalSearch from "../search/GlobalSearch";
import { Separator } from "../ui/separator";

const navItems = [
  { label: "Главная", to: "/" },
  { label: "Эпизоды", to: "/episodes" },
  { label: "Персонажи", to: "/characters" },
  { label: "Атлас", to: "/atlas" }
];

const sectionLabels: Record<string, string> = {
  episodes: "Эпизоды",
  characters: "Персонажи",
  atlas: "Атлас"
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const { theme, mode, preset, setMode, setTheme, setPreset } = useTheme();

  const path = location.pathname;
  const isDetail = path.split("/").filter(Boolean).length > 1;
  const section = path.split("/")[1] ?? "";
  const sectionLabel = sectionLabels[section] ?? "Главная";
  const isEpisodeReading = path.startsWith("/episodes/");

  React.useEffect(() => {
    if (!isEpisodeReading) return;
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      setScrollProgress(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isEpisodeReading]);

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (section) {
      navigate(`/${section}`);
    } else {
      navigate("/");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-6">
          {!isDetail ? (
            <nav className="flex items-center gap-4 text-ui text-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "text-text" : "text-muted hover:text-text"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                Назад
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <NavLink to={`/${section}`} className="hover:text-text">
                      {sectionLabel}
                    </NavLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-text">{path.split("/").slice(-1)[0]}</span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            Поиск
          </Button>
          <Separator className="h-6" orientation="vertical" />
          <ToggleGroup type="single" value={mode} onValueChange={(value) => value && setMode(value as any)}>
            <ToggleGroupItem value="light">День</ToggleGroupItem>
            <ToggleGroupItem value="dark">Ночь</ToggleGroupItem>
          </ToggleGroup>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Aa</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-ui text-xs text-muted">Шрифтовой набор</div>
              <div className="mt-2 flex flex-col gap-2">
                {Object.keys(themePresets).map((key) => (
                  <Button
                    key={key}
                    variant={preset === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreset(key as any)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">...</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-ui text-xs text-muted">Тема</div>
              <div className="mt-2 flex flex-col gap-2">
                {(["paper", "stone", "coral", "amoled"] as const).map((item) => (
                  <Button
                    key={item}
                    variant={theme === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isEpisodeReading && (
        <div className="h-1 w-full bg-border">
          <div className="h-full bg-accent transition-all" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="container flex items-center justify-between py-3 text-ui text-sm">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "text-text" : "text-muted hover:text-text"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
