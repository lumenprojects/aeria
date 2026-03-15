import React from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Moon, Sun, Ellipsis } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "../ui/breadcrumb";
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
  ui: ["IBM Plex Sans", "Manrope", "Golos Text"],
  heading: ["Playfair Display", "Cormorant Garamond"],
  body: ["Lora", "Noto Serif"]
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
  { value: "ripple", label: "Ripple" },
  { value: "spark", label: "Spark" },
  { value: "pulse", label: "Pulse" }
] as const;

const panelMotion = {
  initial: { opacity: 0, y: -10, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.985 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [activePanel, setActivePanel] = React.useState<"fonts" | "settings" | null>(null);
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

  function togglePanel(panel: "fonts" | "settings") {
    setSearchOpen(false);
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-background">
        <div className="relative">
          {isEpisodeReading && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-divider">
              <motion.div
                className="h-full bg-accent"
                animate={{ scaleX: scrollProgress / 100 }}
                initial={false}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ transformOrigin: "0% 50%" }}
              />
            </div>
          )}
          <div className="width-wide navbar-shell">
            <div className="navbar-left role-ui">
              <AnimatePresence initial={false} mode="wait">
                {!isDetail ? (
                  <motion.nav key="navbar-sections" className="navbar-links" {...panelMotion}>
                    {navItems.map((item, index) => (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ delay: index * 0.03, duration: 0.18 }}
                        whileHover={{ y: -1.5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "navbar-link role-ui",
                              isActive
                                ? "navbar-link-active ui-underline-click ui-underline-active"
                                : "tone-secondary hover:text-text"
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      </motion.div>
                    ))}
                  </motion.nav>
                ) : (
                  <motion.div key="navbar-detail" className="navbar-detail" {...panelMotion}>
                    <motion.div whileHover={{ x: -1.5 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="navbar-back tone-secondary hover:text-text"
                        onClick={handleBack}
                      >
                        Назад
                      </Button>
                    </motion.div>
                    <Breadcrumb>
                      <BreadcrumbList className="role-ui tone-secondary">
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="navbar-center">
              <motion.div whileHover={{ y: -1.5, scale: 1.015 }} transition={{ duration: 0.18 }}>
                <NavLink to="/" className="navbar-logo" aria-label="Aeria">
                  <span className="navbar-logo-image" aria-hidden="true" />
                </NavLink>
              </motion.div>
            </div>

            <div className="navbar-right role-ui">
              <div className="navbar-tool-cluster">
                <motion.button
                  type="button"
                  aria-label="Поиск"
                  className={cn(
                    "navbar-icon ui-underline-click",
                    searchOpen && "navbar-icon-active ui-underline-active"
                  )}
                  whileHover={{ y: -1.5, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setActivePanel(null);
                    setSearchOpen((value) => !value);
                  }}
                >
                  <motion.span animate={{ rotate: searchOpen ? -8 : 0 }} transition={{ duration: 0.2 }}>
                    <Search size={20} />
                  </motion.span>
                </motion.button>
                <AnimatePresence initial={false}>
                  {isEpisodeReading && (
                    <motion.span
                      key="navbar-reading"
                      className="navbar-reading"
                      title={seriesTitle ?? ""}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {currentEpisode ?? "—"}/{totalEpisodes ?? "—"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="navbar-divider" aria-hidden="true" />
              <div className="navbar-tool-cluster">
                <motion.button
                  type="button"
                  aria-label={mode === "dark" ? "Переключить на дневной режим" : "Переключить на ночной режим"}
                  className="navbar-icon"
                  whileHover={{ y: -1.5, scale: 1.03 }}
                  whileTap={{ rotate: mode === "dark" ? 14 : -14, scale: 0.96 }}
                  onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                >
                  <motion.span
                    key={mode}
                    initial={false}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 0.18 }}
                  >
                    {mode === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                  </motion.span>
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="Шрифты"
                  className={cn(
                    "navbar-icon navbar-icon-text ui-underline-click",
                    activePanel === "fonts" && "navbar-icon-active ui-underline-active"
                  )}
                  whileHover={{ y: -1.5, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => togglePanel("fonts")}
                >
                  <motion.span animate={{ letterSpacing: activePanel === "fonts" ? "0.08em" : "0.04em" }} transition={{ duration: 0.18 }}>
                    Aa
                  </motion.span>
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="Настройки"
                  className={cn(
                    "navbar-icon ui-underline-click",
                    activePanel === "settings" && "navbar-icon-active ui-underline-active"
                  )}
                  whileHover={{ y: -1.5, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => togglePanel("settings")}
                >
                  <motion.span animate={{ rotate: activePanel === "settings" ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <Ellipsis size={20} />
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {activePanel && (
            <motion.div key={activePanel} className="navbar-subpanel-shell" {...panelMotion}>
              <div className="width-wide">
                <div className="navbar-subpanel-inner">
                  <div className="navbar-subpanel-panel role-ui">
                    {activePanel === "fonts" ? (
                      <>
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
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-divider bg-background md:hidden">
        <div className="width-wide flex items-center justify-between navbar-mobile-row role-ui">
          {navItems.map((item) => (
            <motion.div key={item.to} whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "navbar-link role-ui",
                    isActive
                      ? "navbar-link-active ui-underline-click ui-underline-active"
                      : "tone-secondary hover:text-text"
                  )
                }
              >
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>
    </>
  );
}
