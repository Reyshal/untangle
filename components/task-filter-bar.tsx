"use client";

import React from "react";
import {
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Tag,
  Calendar,
  Type,
  RotateCcw,
} from "lucide-react";

export type SortKey = "date" | "priority" | "title";
export type SortDirection = "asc" | "desc";

export interface SortRule {
  key: SortKey;
  dir: SortDirection;
}

interface TaskFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: "all" | "high" | "medium" | "low";
  onPriorityChange: (p: "all" | "high" | "medium" | "low") => void;
  statusFilter: "all" | "active" | "completed";
  onStatusChange: (s: "all" | "active" | "completed") => void;
  activeSorts?: SortRule[];
  onToggleSort?: (key: SortKey, e: React.MouseEvent) => void;
  onResetSort?: () => void;
  totalTasks: number;
  completedTasks: number;
}

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  statusFilter,
  onStatusChange,
  activeSorts = [],
  onToggleSort,
  onResetSort,
  totalTasks,
  completedTasks,
}: TaskFilterBarProps) {
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const renderSortButton = (key: SortKey, label: string, icon: React.ReactNode) => {
    const activeIndex = activeSorts.findIndex((s) => s.key === key);
    const isActive = activeIndex !== -1;
    const rule = isActive ? activeSorts[activeIndex] : null;
    const showRank = activeSorts.length > 1 && isActive;

    return (
      <button
        type="button"
        onClick={(e) => onToggleSort?.(key, e)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none ${
          isActive
            ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
            : "bg-background-subtle border-border text-foreground-muted hover:text-foreground hover:bg-border-muted"
        }`}
        title={`Sort by ${label} (Click to toggle Asc/Desc/Off, Shift+Click to multi-sort)`}
      >
        {icon}
        <span>{label}</span>

        {/* Direction icon */}
        {rule ? (
          rule.dir === "asc" ? (
            <ArrowUp className="w-3 h-3 text-primary shrink-0 stroke-[2.5]" />
          ) : (
            <ArrowDown className="w-3 h-3 text-primary shrink-0 stroke-[2.5]" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-foreground-muted/40 shrink-0" />
        )}

        {/* Hierarchy Rank Badge for Multi-Sort */}
        {showRank && (
          <span className="w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold shrink-0">
            {activeIndex + 1}
          </span>
        )}
      </button>
    );
  };

  const isCustomSortActive = activeSorts.length > 0;

  return (
    <div className="w-full flex flex-col gap-3 pb-2">
      {/* Progress overview */}
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>
          Progress: <strong className="text-foreground">{completedTasks}</strong> of{" "}
          <strong className="text-foreground">{totalTasks}</strong> completed ({percent}%)
        </span>
        <div className="w-32 h-1.5 bg-background-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks in this list..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-background-subtle p-1 rounded-lg border border-border text-xs self-start sm:self-auto">
          {(["all", "active", "completed"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer font-medium ${
                statusFilter === status
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-background-subtle p-1 rounded-lg border border-border text-xs self-start sm:self-auto">
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPriorityChange(p)}
              className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer font-medium ${
                priorityFilter === p
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Buttons Row */}
      {onToggleSort && (
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-foreground-muted flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              Sort:
            </span>

            {renderSortButton("priority", "Priority", <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />)}
            {renderSortButton("date", "Date & Time", <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />)}
            {renderSortButton("title", "Title", <Type className="w-3.5 h-3.5 text-blue-500 shrink-0" />)}

            {isCustomSortActive && onResetSort && (
              <button
                type="button"
                onClick={onResetSort}
                className="text-[11px] text-foreground-muted hover:text-foreground inline-flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
                title="Reset to default order"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-foreground-muted/70 hidden md:inline">
            Tip: 1-click to sort. Shift+Click to combine multiple sorts.
          </span>
        </div>
      )}
    </div>
  );
}
