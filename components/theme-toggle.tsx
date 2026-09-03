"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors cursor-pointer border border-transparent hover:border-border"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
