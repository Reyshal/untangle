"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return "light";
  const storedTheme = localStorage.getItem("untangle-theme");
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot() {
  return "light";
}

export function ThemeToggle() {
  const currentTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("untangle-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    // Dispatch a storage event so useSyncExternalStore updates immediately
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
      className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors cursor-pointer border border-transparent hover:border-border"
      title={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
    >
      {currentTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
