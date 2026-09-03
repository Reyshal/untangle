"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { TaskWithList } from "@/lib/repositories/task-repository";
import { TaskItem } from "@/components/task-item";
import { Task } from "@/lib/db/schema";
import { Button } from "./ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  Sun,
  Flame,
} from "lucide-react";

interface TodayFocusSectionProps {
  tasks: TaskWithList[];
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenQuickTaskForToday: () => void;
  isLoading?: boolean;
}

type TabType = "all" | "today" | "overdue";

export function TodayFocusSection({
  tasks,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onOpenQuickTaskForToday,
  isLoading = false,
}: TodayFocusSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Calculate dates
  const {
    todayTasks,
    overdueTasks,
    allFocusTasks,
    completedCount,
    totalCount,
  } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const overdue: TaskWithList[] = [];
    const today: TaskWithList[] = [];

    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      if (isNaN(d.getTime())) return;

      if (!t.isDone && d < startOfToday) {
        overdue.push(t);
      } else if (d >= startOfToday && d <= endOfToday) {
        today.push(t);
      }
    });

    const combined = [...overdue, ...today];
    const completed = combined.filter((t) => t.isDone).length;

    return {
      todayTasks: today,
      overdueTasks: overdue,
      allFocusTasks: combined,
      completedCount: completed,
      totalCount: combined.length,
    };
  }, [tasks]);

  const displayedTasks = useMemo(() => {
    if (activeTab === "today") return todayTasks;
    if (activeTab === "overdue") return overdueTasks;
    return allFocusTasks;
  }, [activeTab, todayTasks, overdueTasks, allFocusTasks]);

  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-4 animate-pulse-subtle">
        <div className="h-6 w-48 bg-background-subtle rounded-md" />
        <div className="h-20 bg-background-subtle rounded-xl" />
        <div className="h-20 bg-background-subtle rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Today&apos;s Focus &amp; Urgent
              </h2>
              {overdueTasks.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                  <Flame className="w-3 h-3" />
                  <span>{overdueTasks.length} Overdue</span>
                </span>
              )}
            </div>
            <p className="text-xs text-foreground-muted">
              Action items requiring your immediate attention today.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenQuickTaskForToday}
            className="text-primary hover:text-primary hover:bg-primary/10 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Focus Task</span>
          </Button>

          <Link href="/dashboard/schedule?filter=today">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Schedule</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress & Filters Bar */}
      {totalCount > 0 && (
        <div className="flex flex-col gap-3 pt-1">
          {/* Progress Tracker */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-background-subtle/70 border border-border/60">
            <div className="flex items-center justify-between text-xs text-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {completedCount} of {totalCount} completed
                </span>
              </div>
              <span className="font-semibold text-primary">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background-subtle hover:bg-border-muted text-foreground-muted border-border"
              }`}
            >
              All Focus ({allFocusTasks.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer border ${
                activeTab === "today"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background-subtle hover:bg-border-muted text-foreground-muted border-border"
              }`}
            >
              Due Today ({todayTasks.length})
            </button>

            {overdueTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("overdue")}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer border flex items-center gap-1.5 ${
                  activeTab === "overdue"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20"
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue ({overdueTasks.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task List or Empty State */}
      {displayedTasks.length === 0 ? (
        <div className="p-8 rounded-xl bg-background-subtle/50 border border-dashed border-border text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-sm font-bold text-foreground">
              {totalCount > 0 && completedCount === totalCount
                ? "All caught up for today! 🎉"
                : "No urgent tasks due right now 🌿"}
            </h3>
            <p className="text-xs text-foreground-muted">
              {totalCount > 0 && completedCount === totalCount
                ? "You've untangled and conquered every item on today's focus list. Take a mindful pause!"
                : "Your schedule is clear. Plan ahead with a new brain dump or add a focus task for today."}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuickTaskForToday}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task for Today</span>
            </Button>
            <Link href="/dashboard/schedule">
              <Button variant="ghost" size="sm" className="text-xs">
                <span>Browse Schedule</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {displayedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggleTask}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
