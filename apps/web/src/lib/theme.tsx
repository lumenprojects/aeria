import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCookie, setCookie } from "./cookies";

export type ThemeName = "paper" | "stone" | "coral" | "amoled";
export type ThemeMode = "light" | "dark";
export type TapEffect = "none" | "ripple";

export type FontSet = {
  heading: string;
  body: string;
  ui: string;
};

const defaultFonts: FontSet = {
  heading: "Fraunces",
  body: "Source Serif 4",
  ui: "Manrope"
};

const legacyPresets: Record<string, FontSet> = {
  serif: {
    heading: "Fraunces",
    body: "Source Serif 4",
    ui: "Manrope"
  },
  editorial: {
    heading: "Playfair Display",
    body: "Spectral",
    ui: "IBM Plex Sans"
  }
};

type ThemeState = {
  theme: ThemeName;
  mode: ThemeMode;
  fontHeading: string;
  fontBody: string;
  fontUi: string;
  noise: boolean;
  tapEffect: TapEffect;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  setFontHeading: (font: string) => void;
  setFontBody: (font: string) => void;
  setFontUi: (font: string) => void;
  setNoise: (value: boolean) => void;
  setTapEffect: (value: TapEffect) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = "aeria-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

function safeParseTheme(raw: string | null) {
  if (!raw) return null as null | Record<string, any>;
  try {
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("paper");
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [fontHeading, setFontHeading] = useState<string>(defaultFonts.heading);
  const [fontBody, setFontBody] = useState<string>(defaultFonts.body);
  const [fontUi, setFontUi] = useState<string>(defaultFonts.ui);
  const [noise, setNoise] = useState<boolean>(false);
  const [tapEffect, setTapEffect] = useState<TapEffect>("none");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cookieValue = getCookie(STORAGE_KEY);
    const cookiePayload = safeParseTheme(cookieValue);
    if (cookiePayload) {
      if (cookiePayload.theme) setTheme(cookiePayload.theme as ThemeName);
      if (cookiePayload.mode) setMode(cookiePayload.mode as ThemeMode);
      if (cookiePayload.fontHeading) setFontHeading(String(cookiePayload.fontHeading));
      if (cookiePayload.fontBody) setFontBody(String(cookiePayload.fontBody));
      if (cookiePayload.fontUi) setFontUi(String(cookiePayload.fontUi));
      if (typeof cookiePayload.noise === "boolean") setNoise(cookiePayload.noise);
      if (cookiePayload.tapEffect) setTapEffect(cookiePayload.tapEffect as TapEffect);
      setHydrated(true);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParseTheme(saved);
    if (parsed) {
      if (parsed.theme) setTheme(parsed.theme as ThemeName);
      if (parsed.mode) setMode(parsed.mode as ThemeMode);
      if (parsed.preset && legacyPresets[parsed.preset]) {
        const preset = legacyPresets[parsed.preset];
        setFontHeading(preset.heading);
        setFontBody(preset.body);
        setFontUi(preset.ui);
      }
      if (parsed.fontHeading) setFontHeading(String(parsed.fontHeading));
      if (parsed.fontBody) setFontBody(String(parsed.fontBody));
      if (parsed.fontUi) setFontUi(String(parsed.fontUi));
      if (typeof parsed.noise === "boolean") setNoise(parsed.noise);
      if (parsed.tapEffect) setTapEffect(parsed.tapEffect as TapEffect);
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", mode);
    root.style.setProperty("--font-heading", fontHeading);
    root.style.setProperty("--font-body", fontBody);
    root.style.setProperty("--font-ui", fontUi);
    root.style.setProperty("--noise-opacity", noise ? "0.08" : "0");

    setCookie(
      STORAGE_KEY,
      JSON.stringify({
        theme,
        mode,
        fontHeading,
        fontBody,
        fontUi,
        noise,
        tapEffect
      }),
      {
        path: "/",
        maxAge: ONE_YEAR,
        sameSite: "Lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:"
      }
    );
  }, [theme, mode, fontHeading, fontBody, fontUi, noise, tapEffect, hydrated]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      fontHeading,
      fontBody,
      fontUi,
      noise,
      tapEffect,
      setTheme,
      setMode,
      setFontHeading,
      setFontBody,
      setFontUi,
      setNoise,
      setTapEffect
    }),
    [theme, mode, fontHeading, fontBody, fontUi, noise, tapEffect]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
