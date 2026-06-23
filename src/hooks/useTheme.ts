import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";
const KEY = "medinova-theme";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitial();
    setTheme(t);
    apply(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      apply(next);
      try { window.localStorage.setItem(KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { theme, toggle };
}
