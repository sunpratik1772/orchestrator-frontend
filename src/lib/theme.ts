import { useEffect } from "react";
import { create } from "zustand";

export type Theme = "dark" | "light" | "claude" | "ocean";

export const THEME_META: Record<Theme, { label: string; description: string; swatch: string }> = {
  dark:   { label: "Dark",            description: "Studio default",           swatch: "#141414" },
  light:  { label: "Light",           description: "Paper-cream editorial",    swatch: "#fafafa" },
  claude: { label: "Claude",          description: "Warm cream + peach",       swatch: "#d97757" },
  ocean:  { label: "Ocean",           description: "Matte turquoise",          swatch: "#14b8a6" },
};

export const ALL_THEMES: Theme[] = ["dark", "light", "claude", "ocean"];

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const STORAGE_KEY = "dbsherpa:theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && (ALL_THEMES as string[]).includes(saved)) return saved as Theme;
  } catch {
    /* noop */
  }
  return "dark";
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: readInitial(),
  setTheme: (t) => {
    try { window.localStorage.setItem(STORAGE_KEY, t); } catch { /* noop */ }
    set({ theme: t });
  },
  // Cycle through themes (still bound to the icon button as a quick-toggle).
  toggle: () => {
    const order = ALL_THEMES;
    const idx = order.indexOf(get().theme);
    const next = order[(idx + 1) % order.length];
    get().setTheme(next);
  },
}));

/**
 * Mount this once near the root. Mirrors the user's choice onto
 * `<html data-theme>` so all CSS variables in index.css resolve correctly,
 * and toggles the legacy `.dark` class so Tailwind's `dark:` variants work.
 * Only the `dark` theme gets the `.dark` class — the three light-ish themes
 * (light, claude, ocean) keep `.dark` off so shadcn defaults stay light.
 */
export function useApplyTheme(): void {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
}

/** Centralized colour tokens — every value resolves through CSS variables,
 *  so a single `<html data-theme>` flip restyles the entire app. */
export const T = {
  bg:           "var(--c-bg)",
  surface1:     "var(--c-surface-1)",
  surface2:     "var(--c-surface-2)",
  surface3:     "var(--c-surface-3)",
  surfaceActive:"var(--c-surface-active)",
  border:       "var(--c-border)",
  borderSoft:   "var(--c-border-soft)",
  text0:        "var(--c-text-0)",
  text1:        "var(--c-text-1)",
  text2:        "var(--c-text-2)",
  text3:        "var(--c-text-3)",
  text4:        "var(--c-text-4)",
  violet:       "var(--c-violet)",
  violetSoftBg: "var(--c-violet-soft-bg)",
  violetSoftBgHi: "var(--c-violet-soft-bg-hi)",
  violetSoftBorder: "var(--c-violet-soft-border)",
  violetText:   "var(--c-violet-text)",
  dangerBg:     "var(--c-danger-bg)",
  dangerBorder: "var(--c-danger-border)",
  dangerText:   "var(--c-danger-text)",
} as const;
