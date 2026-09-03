"use client";

import { useTheme } from "@/lib/hooks/use-theme";

/**
 * ThemeSync mounts in the root layout to continuously ensure
 * document.documentElement.classList.contains("dark") matches
 * the stored theme setting, preventing React 19 hydration from
 * stripping the dark class on page refresh.
 */
export function ThemeSync() {
  useTheme();
  return null;
}
