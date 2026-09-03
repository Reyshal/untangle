"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "untangle-theme";
export const THEME_CHANGE_EVENT = "untangle-theme-change";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return getSystemTheme();
}

function subscribe(callback: () => void) {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY || !e.key) {
      callback();
    }
  };
  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleCustom);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMedia = () => {
    if (!localStorage.getItem(THEME_STORAGE_KEY)) {
      callback();
    }
  };
  media.addEventListener("change", handleMedia);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustom);
    media.removeEventListener("change", handleMedia);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    getStoredTheme,
    () => "light" // Server snapshot
  );

  // Keep documentElement classList strictly in sync on mount and state changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
