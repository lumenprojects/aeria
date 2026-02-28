import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeName = "paper" | "stone" | "coral" | "amoled";
export type ThemeMode = "light" | "dark";

export type FontPreset = {
  heading: string;
  body: string;
  ui: string;
};

const presets: Record<string, FontPreset> = {
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
  preset: keyof typeof presets;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: keyof typeof presets) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = "aeria-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("paper");
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [preset, setPreset] = useState<keyof typeof presets>("serif");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { theme: ThemeName; mode: ThemeMode; preset: keyof typeof presets };
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.preset) setPreset(parsed.preset);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", mode);
    const selected = presets[preset];
    root.style.setProperty("--font-heading", selected.heading);
    root.style.setProperty("--font-body", selected.body);
    root.style.setProperty("--font-ui", selected.ui);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, mode, preset }));
  }, [theme, mode, preset]);

  const value = useMemo(() => ({ theme, mode, preset, setTheme, setMode, setPreset }), [theme, mode, preset]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export const themePresets = presets;
