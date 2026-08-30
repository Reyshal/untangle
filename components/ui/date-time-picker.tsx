"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, isToday, isTomorrow, addDays, startOfDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  value: Date | string | null;
  onChange: (date: Date | null) => void;
  includeTime?: boolean;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}

const QUICK_TIME_PRESETS = [
  { label: "08:00 • Breakfast", time: "08:00" },
  { label: "09:30 • Morning", time: "09:30" },
  { label: "12:30 • Lunch", time: "12:30" },
  { label: "15:00 • Afternoon", time: "15:00" },
  { label: "18:00 • Gym/Evening", time: "18:00" },
  { label: "19:30 • Dinner", time: "19:30" },
  { label: "21:30 • Night", time: "21:30" },
];

export function DateTimePicker({
  value,
  onChange,
  includeTime = true,
  placeholder = "Pick a date & time",
  className = "",
  align = "left",
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate: Date | null = value
    ? typeof value === "string"
      ? new Date(value)
      : value
    : null;

  const validDate = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : null;

  // Derive timeString directly from validDate to prevent state desync
  const formattedTimeFromDate = validDate
    ? `${String(validDate.getHours()).padStart(2, "0")}:${String(validDate.getMinutes()).padStart(2, "0")}`
    : "09:00";

  const [userTimeString, setUserTimeString] = useState<string | null>(null);
  const timeString = userTimeString ?? formattedTimeFromDate;

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setUserTimeString(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      setUserTimeString(null);
      onChange(null);
      return;
    }

    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(day);
    newDate.setHours(hours || 9, minutes || 0, 0, 0);
    setUserTimeString(null);
    onChange(newDate);
  };

  const handleTimeChange = (newTime: string) => {
    setUserTimeString(newTime);
    const [hours, minutes] = newTime.split(":").map(Number);

    const base = validDate || new Date();
    const newDate = new Date(base);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    onChange(newDate);
  };

  const handleQuickDatePreset = (daysToAdd: number) => {
    const d = addDays(startOfDay(new Date()), daysToAdd);
    const [hours, minutes] = timeString.split(":").map(Number);
    d.setHours(hours || 9, minutes || 0, 0, 0);
    setUserTimeString(null);
    onChange(d);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserTimeString(null);
    onChange(null);
    setIsOpen(false);
  };

  const formatButtonLabel = () => {
    if (!validDate) return placeholder;

    let dateText = "";
    if (isToday(validDate)) {
      dateText = "Today";
    } else if (isTomorrow(validDate)) {
      dateText = "Tomorrow";
    } else {
      dateText = format(validDate, "MMM d");
    }

    if (includeTime) {
      const timePart = format(validDate, "h:mm a");
      return `${dateText} • ${timePart}`;
    }

    return dateText;
  };

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"} inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
          validDate
            ? "bg-background-subtle border-border text-foreground font-medium hover:border-primary/50"
            : "bg-transparent border-dashed border-border text-foreground-muted hover:text-foreground hover:bg-background-subtle"
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[180px]">{formatButtonLabel()}</span>

        {validDate ? (
          <span
            onClick={handleClear}
            className="text-foreground-muted hover:text-destructive p-0.5 rounded transition-colors ml-1"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        ) : null}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 p-3 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md animate-fade-in ${
            align === "right" ? "right-0" : "left-0"
          } w-[290px] sm:w-[320px]`}
        >
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 pb-2.5 mb-2 border-b border-border text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDatePreset(0)}
              className="flex-1 py-1 rounded-md bg-background-subtle hover:bg-primary/10 hover:text-primary transition-colors text-center font-medium cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickDatePreset(1)}
              className="flex-1 py-1 rounded-md bg-background-subtle hover:bg-primary/10 hover:text-primary transition-colors text-center font-medium cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => handleQuickDatePreset(7)}
              className="flex-1 py-1 rounded-md bg-background-subtle hover:bg-primary/10 hover:text-primary transition-colors text-center font-medium cursor-pointer"
            >
              Next Week
            </button>
            {validDate && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 rounded-md text-foreground-muted hover:text-destructive transition-colors text-center font-medium cursor-pointer"
                title="Clear date"
              >
                Clear
              </button>
            )}
          </div>

          {/* Calendar */}
          <div className="flex justify-center text-xs">
            <DayPicker
              mode="single"
              selected={validDate || undefined}
              onSelect={handleDaySelect}
              defaultMonth={validDate || new Date()}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="w-4 h-4 text-foreground-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-foreground-muted" />
                  ),
              }}
              classNames={{
                root: "w-full",
                months: "flex flex-col",
                month: "space-y-2",
                month_caption: "flex justify-center pt-0.5 relative items-center mb-1",
                caption_label: "text-xs font-bold text-foreground",
                nav: "space-x-1 flex items-center",
                button_previous:
                  "absolute left-0.5 h-6 w-6 bg-transparent hover:bg-background-subtle p-0 rounded-md inline-flex items-center justify-center cursor-pointer",
                button_next:
                  "absolute right-0.5 h-6 w-6 bg-transparent hover:bg-background-subtle p-0 rounded-md inline-flex items-center justify-center cursor-pointer",
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex justify-between mb-1",
                weekday: "text-foreground-muted rounded-md w-8 font-medium text-[10px] text-center",
                weeks: "w-full",
                week: "flex justify-between w-full mt-0.5",
                day: "h-8 w-8 text-center text-xs p-0 relative focus-within:relative focus-within:z-20 cursor-pointer flex items-center justify-center",
                day_button:
                  "h-8 w-8 p-0 font-normal rounded-md transition-colors hover:bg-primary/20 hover:text-primary aria-selected:opacity-100 flex items-center justify-center cursor-pointer",
                selected: "bg-primary text-primary-foreground font-bold hover:bg-primary hover:text-primary-foreground",
                today: "text-primary font-bold underline underline-offset-4",
                outside: "text-foreground-muted/40 opacity-50",
                disabled: "text-foreground-muted/30 opacity-30 cursor-not-allowed",
              }}
            />
          </div>

          {/* Time Picker Section */}
          {includeTime && (
            <div className="pt-2.5 mt-2 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  Time of Day
                </span>
                <input
                  type="time"
                  value={timeString}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-background-subtle border border-border rounded-md px-2 py-0.5 text-xs text-foreground font-medium outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Contextual Time Chips */}
              <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-0.5">
                {QUICK_TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleTimeChange(preset.time)}
                    className={`px-2 py-1 rounded text-[10px] text-left transition-colors truncate cursor-pointer ${
                      timeString === preset.time
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-background-subtle text-foreground-muted hover:text-foreground hover:bg-border-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Done button */}
          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-foreground-muted">
              {validDate ? format(validDate, "EEE, MMM d, yyyy") : "No date selected"}
            </span>
            <button
              type="button"
              onClick={() => {
                setUserTimeString(null);
                setIsOpen(false);
              }}
              className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-1 rounded-lg shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
