import React from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Moon, Sun, Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "../ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useTheme } from "@/lib/theme";
import { getEpisode, getSeries } from "@/lib/api";
import { cn } from "@/lib/utils";
import GlobalSearch from "../search/GlobalSearch";

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

const fontOptions = {
  ui: ["Manrope", "IBM Plex Sans"],
  heading: ["Fraunces", "Playfair Display"],
  body: ["Source Serif 4", "Spectral"]
};

const themeOptions = [
  { value: "paper", label: "Paper" },
  { value: "stone", label: "Stone" },
  { value: "coral", label: "Coral" },
  { value: "amoled", label: "Amoled" }
] as const;

const noiseOptions = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" }
] as const;

const tapOptions = [
  { value: "none", label: "None" },
  { value: "ripple", label: "Ripple" }
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [fontMenuOpen, setFontMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const {
    theme,
    mode,
    fontHeading,
    fontBody,
    fontUi,
    noise,
    tapEffect,
    setMode,
    setTheme,
    setFontHeading,
    setFontBody,
    setFontUi,
    setNoise,
    setTapEffect
  } = useTheme();

  const path = location.pathname;
  const isDetail = path.split("/").filter(Boolean).length > 1;
  const section = path.split("/")[1] ?? "";
  const sectionLabel = sectionLabels[section] ?? "Главная";
  const isEpisodeReading = path.startsWith("/episodes/") && Boolean(params.slug);

  const episodeQuery = useQuery({
    queryKey: ["episode", params.slug],
    queryFn: () => getEpisode(params.slug as string),
    enabled: isEpisodeReading && Boolean(params.slug)
  });

  const seriesSlug = episodeQuery.data?.series?.slug as string | undefined;
  const seriesTitle = episodeQuery.data?.series?.title_ru as string | undefined;
  const seriesQuery = useQuery({
    queryKey: ["series", seriesSlug],
    queryFn: () => getSeries(seriesSlug as string),
    enabled: Boolean(seriesSlug)
  });

  const currentEpisode = episodeQuery.data?.episode?.episode_number as number | undefined;
  const totalEpisodes = seriesQuery.data?.episodes?.length as number | undefined;

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
    <>
      <header className="sticky top-0 z-40 bg-background">
        <div className="relative">
          {isEpisodeReading && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-divider">
              <div className="h-full bg-accent transition-all" style={{ width: `${scrollProgress}%` }} />
            </div>
          )}
          <div className="container relative flex navbar-shell items-center justify-between">
            <div className="navbar-left role-ui text-sm">
              {!isDetail ? (
                <nav className="navbar-links">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "navbar-link role-ui text-sm",
                          isActive ? "navbar-link-active" : "tone-secondary hover:text-text"
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              ) : (
                <div className="navbar-detail">
                  <Button variant="ghost" size="sm" className="tone-secondary hover:text-text" onClick={handleBack}>
                    Назад
                  </Button>
                  <Breadcrumb>
                    <BreadcrumbList className="role-ui text-sm tone-secondary">
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

            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <NavLink to="/" className="pointer-events-auto navbar-logo">
                Aeria
              </NavLink>
            </div>

            <div className="navbar-right role-ui text-sm">
              <div className="navbar-tool-cluster">
                <button
                  type="button"
                  aria-label="Поиск"
                  className={cn("navbar-icon", searchOpen && "navbar-icon-active")}
                  onClick={() => setSearchOpen((value) => !value)}
                >
                  <Search size={18} />
                </button>
                {isEpisodeReading && (
                  <span className="navbar-reading" title={seriesTitle ?? ""}>
                    {currentEpisode ?? "—"}/{totalEpisodes ?? "—"}
                  </span>
                )}
              </div>
              <span className="navbar-divider" aria-hidden="true" />
              <div className="navbar-tool-cluster">
                <button
                  type="button"
                  aria-label={mode === "dark" ? "Переключить на дневной режим" : "Переключить на ночной режим"}
                  className="navbar-icon"
                  onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                >
                  {mode === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <Popover onOpenChange={setFontMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Шрифты"
                      className={cn("navbar-icon navbar-icon-text", fontMenuOpen && "navbar-icon-active")}
                    >
                      Aa
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={0}
                    avoidCollisions={false}
                    className="navbar-popover navbar-popover-fixed"
                  >
                    <div className="navbar-popover-panel role-ui text-sm">
                      <div className="navbar-field">
                        <span className="navbar-label">UI</span>
                        <select className="navbar-select" value={fontUi} onChange={(event) => setFontUi(event.target.value)}>
                          {fontOptions.ui.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="navbar-field">
                        <span className="navbar-label">Headings</span>
                        <select
                          className="navbar-select"
                          value={fontHeading}
                          onChange={(event) => setFontHeading(event.target.value)}
                        >
                          {fontOptions.heading.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="navbar-field">
                        <span className="navbar-label">Text</span>
                        <select
                          className="navbar-select"
                          value={fontBody}
                          onChange={(event) => setFontBody(event.target.value)}
                        >
                          {fontOptions.body.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover onOpenChange={setSettingsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Настройки"
                      className={cn("navbar-icon", settingsOpen && "navbar-icon-active")}
                    >
                      <Ellipsis size={20} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={0}
                    avoidCollisions={false}
                    className="navbar-popover navbar-popover-fixed"
                  >
                    <div className="navbar-popover-panel role-ui text-sm">
                      <div className="navbar-field">
                        <span className="navbar-label">Style</span>
                        <select
                          className="navbar-select"
                          value={theme}
                          onChange={(event) => setTheme(event.target.value as typeof theme)}
                        >
                          {themeOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="navbar-field">
                        <span className="navbar-label">Noise</span>
                        <select
                          className="navbar-select"
                          value={noise ? "on" : "off"}
                          onChange={(event) => setNoise(event.target.value === "on")}
                        >
                          {noiseOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="navbar-field">
                        <span className="navbar-label">Tap Effect</span>
                        <select
                          className="navbar-select"
                          value={tapEffect}
                          onChange={(event) => setTapEffect(event.target.value as typeof tapEffect)}
                        >
                          {tapOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-divider bg-background md:hidden">
        <div className="container flex items-center justify-between navbar-mobile-row role-ui text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "navbar-link role-ui text-sm",
                  isActive ? "navbar-link-active" : "tone-secondary hover:text-text"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
