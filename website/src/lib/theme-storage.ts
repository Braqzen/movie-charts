export const THEME_STORAGE_KEY = "movie-charts-theme";

export type UiTheme = "light" | "dark";

export function readStoredTheme(): UiTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function writeStoredTheme(theme: UiTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyThemeToDocument(theme: UiTheme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
