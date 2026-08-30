"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  prefixLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  align?: "left" | "right";
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  prefixLabel,
  icon,
  disabled = false,
  className = "",
  align = "left",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

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
            : "bg-background-subtle hover:bg-border-muted border-border text-foreground hover:border-primary/40"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {icon}
        {prefixLabel && (
          <span className="text-foreground-muted text-[11px] font-medium hidden sm:inline">
            {prefixLabel}:
          </span>
        )}
        {selectedOption?.icon}
        <span className="font-medium text-foreground truncate max-w-[130px] sm:max-w-[160px]">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-foreground-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 min-w-[160px] p-1 rounded-xl bg-card border border-border shadow-xl backdrop-blur-md animate-fade-in z-50 flex flex-col gap-0.5 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => {
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
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span className="truncate">{option.label}</span>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
