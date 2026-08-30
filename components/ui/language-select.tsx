"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

export interface LanguageOption {
  value: string;
  label: string;
  shortCode: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "auto", label: "Auto (Same as input)", shortCode: "AUTO" },
  { value: "id", label: "Bahasa Indonesia", shortCode: "ID" },
  { value: "en", label: "English", shortCode: "EN" },
  { value: "es", label: "Español", shortCode: "ES" },
  { value: "ja", label: "日本語 (Japanese)", shortCode: "JA" },
  { value: "fr", label: "Français", shortCode: "FR" },
  { value: "de", label: "Deutsch", shortCode: "DE" },
  { value: "zh", label: "中文 (Chinese)", shortCode: "ZH" },
];

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function LanguageSelect({ value, onChange, disabled = false, className = "" }: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = LANGUAGE_OPTIONS.find((o) => o.value === value) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${isOpen ? "z-50" : "z-20"} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
          isOpen
            ? "bg-background-subtle border-primary/50 text-foreground ring-2 ring-primary/20"
            : "bg-background-subtle/80 hover:bg-background-subtle border-border text-foreground hover:border-primary/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[11px] text-foreground-muted font-medium hidden sm:inline">Output:</span>
        <span className="font-semibold text-foreground text-xs">{activeOption.label.split(" ")[0]}</span>
        <ChevronDown className={`w-3 h-3 text-foreground-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 p-1.5 rounded-xl bg-card border border-border shadow-xl backdrop-blur-md animate-fade-in z-50 flex flex-col gap-0.5">
          <div className="px-2 py-1 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider border-b border-border/50 mb-1">
            Select Output Language
          </div>

          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-background-subtle"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background-subtle text-foreground-muted border-border"
                    }`}
                  >
                    {option.shortCode}
                  </span>
                  <span>{option.label}</span>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
