"use client";

import { createContext, useCallback, useContext } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "marvel-portfolio-theme:v1";

type ThemeContextValue = {
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const toggleTheme = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.dataset.disableTransitions = "true";
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing; the visible theme still updates.
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => delete root.dataset.disableTransitions);
    });
  }, []);

  return <ThemeContext.Provider value={{ toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

export const themeBootstrapScript = `
(function () {
  try {
    var key = '${STORAGE_KEY}';
    var saved = localStorage.getItem(key);
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;
