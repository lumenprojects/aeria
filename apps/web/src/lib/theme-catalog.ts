export const themeCatalog = [
  { value: "paper", label: "Paper", swatch: { light: "#ffb44b", dark: "#f2ca86" } },
  { value: "marble", label: "Marble", swatch: { light: "#dbe4ea", dark: "#e8f0f5" } },
  { value: "ink", label: "Ink", swatch: { light: "#5a55b8", dark: "#9f98f2" } },
  { value: "coral", label: "Coral", swatch: { light: "#f95c4b", dark: "#ff7d6f" } },
  { value: "mint", label: "Mint", swatch: { light: "#4f9e86", dark: "#78c7ad" } },
  { value: "amoled", label: "Amoled", swatch: { light: "#3d8bff", dark: "#72a5ff" } },
  { value: "dawn", label: "Dawn", swatch: { light: "#f4a24f", dark: "#ffd08a" } },
  { value: "arcade", label: "Arcade", swatch: { light: "#ff4fd8", dark: "#35f2ff" } }
] as const;

export type ThemeName = (typeof themeCatalog)[number]["value"];

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && themeCatalog.some((theme) => theme.value === value);
}

export function resolveThemeName(value: unknown): ThemeName | null {
  if (value === "garnet") return "ink";
  if (value === "sunset") return "dawn";
  if (value === "stone") return "marble";
  return isThemeName(value) ? value : null;
}
