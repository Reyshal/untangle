"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TaskWithList } from "@/lib/repositories/task-repository";
import { TaskItem } from "@/components/task-item";
import { Task } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Calendar,
  Sparkles,
  Plus,
  CheckCircle2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Tag,
  Type,
  RotateCcw,
} from "lucide-react";

type DateFilterType = "today" | "week" | "month" | "someday" | "custom" | "all";
type SortKey = "date" | "priority" | "title";
type SortDirection = "asc" | "desc";

interface SortRule {
  key: SortKey;
  dir: SortDirection;
}

function parseSortRules(sortParam: string | null): SortRule[] {
  if (!sortParam) return [];
  const rules: SortRule[] = [];
  sortParam.split(",").forEach((item) => {
    const [key, dir] = item.trim().split(":") as [SortKey, SortDirection];
    if (["date", "priority", "title"].includes(key) && ["asc", "desc"].includes(dir)) {
      rules.push({ key, dir });
    }
  });
  return rules;
}

function serializeSortRules(rules: SortRule[]): string | null {
  if (rules.length === 0) return null;
  return rules.map((r) => `${r.key}:${r.dir}`).join(",");
}

function ScheduleContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [tasks, setTasks] = useState<TaskWithList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive filters directly from URL search params
  const urlFilter = searchParams.get("filter") as DateFilterType;
  const dateFilter: DateFilterType =
    urlFilter && ["today", "week", "month", "someday", "custom", "all"].includes(urlFilter)
      ? urlFilter
      : "today";

  const customStartDate = searchParams.get("from") || "";
  const customEndDate = searchParams.get("to") || "";
  const statusFilter = (searchParams.get("status") as "all" | "active" | "completed") || "all";
  const priorityFilter = (searchParams.get("priority") as "all" | "high" | "medium" | "low") || "all";
  const searchQuery = searchParams.get("q") || "";
  const activeSorts = parseSortRules(searchParams.get("sort"));

  // Helper to update URL query parameters without scroll reset
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (key === "filter") {
        if (!val || val === "today") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      } else if (key === "priority" || key === "status") {
        if (!val || val === "all") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      } else if (key === "sort") {
        if (!val) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      } else {
        if (!val) {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
    });

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok && !ignore) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (e) {
        console.error("Failed to fetch tasks:", e);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleTask = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isDone: !t.isDone } : t))
    );

    try {
      const target = tasks.find((t) => t.id === taskId);
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !target?.isDone }),
      });
    } catch (e) {
      console.error("Failed to toggle task:", e);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error("Failed to update task:", e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  // Handlers with URL sync
  const handleDateFilterChange = (filter: DateFilterType) => {
    if (filter !== "custom") {
      updateUrlParams({ filter, from: null, to: null });
    } else {
      updateUrlParams({ filter });
    }
  };

  const handleCustomRangeChange = (start: string, end: string) => {
    updateUrlParams({ filter: "custom", from: start, to: end });
  };

  const handleStatusFilterChange = (status: "all" | "active" | "completed") => {
    updateUrlParams({ status });
  };

  const handlePriorityFilterChange = (priority: "all" | "high" | "medium" | "low") => {
    updateUrlParams({ priority });
  };

  // Smart 1-Click Sort Handler
  const handleToggleSort = (key: SortKey, e: React.MouseEvent) => {
    const isShiftKey = e.shiftKey;
    const existingIndex = activeSorts.findIndex((s) => s.key === key);

    if (!isShiftKey && (activeSorts.length !== 1 || existingIndex === -1)) {
      const defaultDir: SortDirection = key === "priority" ? "desc" : "asc";
      updateUrlParams({ sort: serializeSortRules([{ key, dir: defaultDir }]) });
      return;
    }

    if (existingIndex !== -1) {
      const current = activeSorts[existingIndex];
      const nextSorts = [...activeSorts];

      if (key === "priority") {
        if (current.dir === "desc") {
          nextSorts[existingIndex] = { key, dir: "asc" };
          updateUrlParams({ sort: serializeSortRules(nextSorts) });
        } else {
          nextSorts.splice(existingIndex, 1);
          updateUrlParams({ sort: serializeSortRules(nextSorts) });
        }
      } else {
        if (current.dir === "asc") {
          nextSorts[existingIndex] = { key, dir: "desc" };
          updateUrlParams({ sort: serializeSortRules(nextSorts) });
        } else {
          nextSorts.splice(existingIndex, 1);
          updateUrlParams({ sort: serializeSortRules(nextSorts) });
        }
      }
    } else {
      const defaultDir: SortDirection = key === "priority" ? "desc" : "asc";
      const nextSorts = [...activeSorts, { key, dir: defaultDir }];
      updateUrlParams({ sort: serializeSortRules(nextSorts) });
    }
  };

  const handleResetSort = () => {
    updateUrlParams({ sort: null });
  };

  const handleSearchChange = (q: string) => {
    updateUrlParams({ q: q.trim() ? q : null });
  };

  // Date Boundaries Calculation
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7)); // Monday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 1. Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    // Status Filter
    if (statusFilter === "active" && task.isDone) return false;
    if (statusFilter === "completed" && !task.isDone) return false;

    // Priority Filter
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchList = task.listTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchList) return false;
    }

    // Date Filter
    const taskDate = task.dueDate ? new Date(task.dueDate) : null;

    switch (dateFilter) {
      case "today":
        if (!taskDate) return false;
        return taskDate >= startOfToday && taskDate <= endOfToday;
      case "week":
        if (!taskDate) return false;
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      case "month":
        if (!taskDate) return false;
        return taskDate >= startOfMonth && taskDate <= endOfMonth;
      case "someday":
        return taskDate === null;
      case "custom":
        if (!taskDate) return false;
        if (customStartDate && taskDate < new Date(`${customStartDate}T00:00:00`)) return false;
        if (customEndDate && taskDate > new Date(`${customEndDate}T23:59:59`)) return false;
        return true;
      case "all":
        return true;
      default:
        return true;
    }
  });

  // 2. Sorting Function for tasks within each group
  const sortTasks = (taskList: TaskWithList[]) => {
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

    return [...taskList].sort((a, b) => {
      // If user specified custom sorts, evaluate in priority order:
      if (activeSorts.length > 0) {
        for (const sort of activeSorts) {
          if (sort.key === "priority") {
            const weightA = priorityWeight[a.priority] || 2;
            const weightB = priorityWeight[b.priority] || 2;
            const diff = weightA - weightB;
            if (diff !== 0) return sort.dir === "desc" ? -diff : diff;
          } else if (sort.key === "title") {
            const diff = a.title.localeCompare(b.title);
            if (diff !== 0) return sort.dir === "asc" ? diff : -diff;
          } else if (sort.key === "date") {
            if (a.dueDate || b.dueDate) {
              if (!a.dueDate) return sort.dir === "asc" ? 1 : -1;
              if (!b.dueDate) return sort.dir === "asc" ? -1 : 1;
              const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              if (diff !== 0) return sort.dir === "asc" ? diff : -diff;
            }
          }
        }
      }

      // Default secondary/fallback sort: earliest time of day, then original order
      if (a.dueDate && b.dueDate) {
        const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      return a.sortOrder - b.sortOrder;
    });
  };

  // 3. Group filtered tasks by Date Group
  const groups: { [key: string]: { label: string; tasks: TaskWithList[] } } = {};

  filteredTasks.forEach((task) => {
    let key = "someday";
    let label = "Someday / No Scheduled Date";

    if (task.dueDate) {
      const d = new Date(task.dueDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateString = `${yyyy}-${mm}-${dd}`;

      if (d < startOfToday) {
        key = `past_${dateString}`;
        label = `Past • ${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: yyyy !== now.getFullYear() ? "numeric" : undefined })}`;
      } else if (d >= startOfToday && d <= endOfToday) {
        key = "today";
        label = `Today • ${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
      } else {
        const tomorrow = new Date(startOfToday);
        tomorrow.setDate(startOfToday.getDate() + 1);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        if (d >= tomorrow && d <= endOfTomorrow) {
          key = "tomorrow";
          label = `Tomorrow • ${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
        } else {
          key = dateString;
          label = d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: yyyy !== now.getFullYear() ? "numeric" : undefined,
          });
        }
      }
    }

    if (!groups[key]) {
      groups[key] = { label, tasks: [] };
    }
    groups[key].tasks.push(task);
  });

  // Sort groups: Past first, Today next, Tomorrow next, then chronological dates, then Someday last
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a.startsWith("past_") && !b.startsWith("past_")) return -1;
    if (!a.startsWith("past_") && b.startsWith("past_")) return 1;
    if (a.startsWith("past_") && b.startsWith("past_")) return a.localeCompare(b);

    if (a === "today") return -1;
    if (b === "today") return 1;
    if (a === "tomorrow") return -1;
    if (b === "tomorrow") return 1;
    if (a === "someday") return 1;
    if (b === "someday") return -1;
    return a.localeCompare(b);
  });

  const totalFiltered = filteredTasks.length;
  const completedFiltered = filteredTasks.filter((t) => t.isDone).length;
  const percentComplete = totalFiltered > 0 ? Math.round((completedFiltered / totalFiltered) * 100) : 0;

  // Helper to render sort button state
  const renderSortButton = (key: SortKey, label: string, icon: React.ReactNode) => {
    const activeIndex = activeSorts.findIndex((s) => s.key === key);
    const isActive = activeIndex !== -1;
    const rule = isActive ? activeSorts[activeIndex] : null;
    const showRank = activeSorts.length > 1 && isActive;

    return (
      <button
        type="button"
        onClick={(e) => handleToggleSort(key, e)}
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
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Schedule & Timeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            View, organize, and check off your tasks by scheduled date and time.
          </p>
        </div>

        <Link href="/dashboard/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" />
            <span>New Brain Dump</span>
          </Button>
        </Link>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs font-medium">
        {[
          { id: "today", label: "Today" },
          { id: "week", label: "This Week" },
          { id: "month", label: "This Month" },
          { id: "someday", label: "No Date (Someday)" },
          { id: "custom", label: "Custom Range" },
          { id: "all", label: "All Tasks" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleDateFilterChange(tab.id as DateFilterType)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              dateFilter === tab.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker (Shown if 'custom' is selected) */}
      {dateFilter === "custom" && (
        <div className="relative z-30 flex items-center gap-3 animate-fade-in">
          <DateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onRangeChange={handleCustomRangeChange}
            onReset={() => handleCustomRangeChange("", "")}
          />
        </div>
      )}

      {/* Search & Sub-filters Bar */}
      <div className="p-3 sm:p-4 rounded-xl bg-card border border-border flex flex-col gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, notes, or lists..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-background-subtle border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Priority & Status dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect
              prefixLabel="Priority"
              value={priorityFilter}
              onChange={(val) => handlePriorityFilterChange(val as "all" | "high" | "medium" | "low")}
              options={[
                { value: "all", label: "All Priorities" },
                { value: "high", label: "High Priority" },
                { value: "medium", label: "Medium Priority" },
                { value: "low", label: "Low Priority" },
              ]}
              align="right"
            />

            <CustomSelect
              prefixLabel="Status"
              value={statusFilter}
              onChange={(val) => handleStatusFilterChange(val as "all" | "active" | "completed")}
              options={[
                { value: "all", label: "All Tasks" },
                { value: "active", label: "Active Only" },
                { value: "completed", label: "Completed Only" },
              ]}
              align="right"
            />
          </div>
        </div>

        {/* 3 Multi-Sort Buttons: Priority, Date, Title */}
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-foreground-muted flex items-center gap-1 mr-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              Sort:
            </span>

            {renderSortButton("priority", "Priority", <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />)}
            {renderSortButton("date", "Date & Time", <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />)}
            {renderSortButton("title", "Title", <Type className="w-3.5 h-3.5 text-blue-500 shrink-0" />)}

            {isCustomSortActive && (
              <button
                type="button"
                onClick={handleResetSort}
                className="text-[11px] text-foreground-muted hover:text-foreground inline-flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer"
                title="Reset to default sort (Natural time order)"
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
      </div>

      {/* Progress & Summary Overview */}
      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span>
          Showing <strong className="text-foreground">{totalFiltered}</strong> tasks
          {dateFilter !== "all" ? ` for ${dateFilter}` : " across all dates"}
        </span>
        {totalFiltered > 0 && (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {completedFiltered}/{totalFiltered} done ({percentComplete}%)
            </span>
          </span>
        )}
      </div>

      {/* Task List / Grouped Views */}
      {isLoading ? (
        <div className="py-16 text-center text-foreground-muted text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading your schedule...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border border-dashed flex flex-col items-center gap-3">
          <Sparkles className="w-8 h-8 text-foreground-muted/40" />
          <h3 className="text-base font-semibold text-foreground">No tasks match this filter</h3>
          <p className="text-xs text-foreground-muted max-w-sm">
            {dateFilter === "today"
              ? "You have no tasks scheduled for today. Check 'This Week' or create a new brain dump!"
              : "Try adjusting your date range, priority, or search filters to find what you're looking for."}
          </p>
          <Link href="/dashboard/new" className="mt-2">
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Decompose New Tasks</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {sortedGroupKeys.map((groupKey) => {
            const group = groups[groupKey];
            if (!group || group.tasks.length === 0) return null;

            // Apply sort inside each group
            const sortedGroupTasks = sortTasks(group.tasks);

            return (
              <div key={groupKey} className="flex flex-col gap-3">
                {/* Group Heading */}
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>{group.label}</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-background-subtle text-foreground-muted border border-border">
                      {sortedGroupTasks.length}
                    </span>
                  </h2>
                </div>

                {/* Tasks in this group */}
                <div className="flex flex-col gap-2.5">
                  {sortedGroupTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-foreground-muted text-sm flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading schedule...</span>
        </div>
      }
    >
      <ScheduleContent />
    </Suspense>
  );
}
