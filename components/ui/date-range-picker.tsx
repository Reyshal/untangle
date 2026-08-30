"use client";

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import { CalendarRange, X, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  onReset: () => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange, onReset }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const range: DateRange | undefined = {
    from: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    to: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
  };

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

  const handleSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) {
      onReset();
      return;
    }
    const fromStr = selectedRange.from ? format(selectedRange.from, "yyyy-MM-dd") : "";
    const toStr = selectedRange.to ? format(selectedRange.to, "yyyy-MM-dd") : fromStr;
    onRangeChange(fromStr, toStr);
  };

  const formatButtonLabel = () => {
    if (!startDate && !endDate) return "Select custom date range...";
    if (startDate && !endDate) return `From ${format(new Date(`${startDate}T00:00:00`), "MMM d, yyyy")}`;
    return `${format(new Date(`${startDate}T00:00:00`), "MMM d")} – ${format(new Date(`${endDate}T00:00:00`), "MMM d, yyyy")}`;
  };

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-20"} inline-block`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground font-medium hover:border-primary/50 transition-all cursor-pointer shadow-xs"
      >
        <CalendarRange className="w-4 h-4 text-primary shrink-0" />
        <span>{formatButtonLabel()}</span>
        {(startDate || endDate) && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="text-foreground-muted hover:text-destructive p-0.5 rounded transition-colors ml-1"
            title="Reset range"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md animate-fade-in w-[300px] sm:w-[320px]">
          <div className="flex justify-center select-none text-xs">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              defaultMonth={range.from || new Date()}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  ),
              }}
              classNames={{
                months: "flex flex-col",
                month_caption: "flex justify-center pt-1 relative items-center mb-2 font-semibold text-xs text-foreground",
                button_previous: "p-1 rounded-lg hover:bg-background-subtle text-foreground-muted hover:text-foreground transition-colors cursor-pointer",
                button_next: "p-1 rounded-lg hover:bg-background-subtle text-foreground-muted hover:text-foreground transition-colors cursor-pointer",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex justify-between mb-1",
                weekday: "text-foreground-muted w-8 font-medium text-[11px] text-center",
                week: "flex w-full justify-between mt-1",
                day: "p-0 text-center relative focus-within:relative focus-within:z-20 w-8 h-8 flex items-center justify-center",
                day_button: "w-8 h-8 p-0 font-normal rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-primary/15 hover:text-white text-xs",
                selected: "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground",
                range_middle: "bg-primary/15 text-primary rounded-none font-medium",
                range_start: "rounded-l-lg bg-primary text-primary-foreground font-bold",
                range_end: "rounded-r-lg bg-primary text-primary-foreground font-bold",
                today: "font-bold text-primary underline underline-offset-2",
                outside: "text-foreground-muted/30 opacity-50",
                disabled: "text-foreground-muted/20 opacity-30 cursor-not-allowed",
              }}
            />
          </div>

          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-foreground-muted hover:text-foreground px-2 py-1"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1 rounded-lg shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
