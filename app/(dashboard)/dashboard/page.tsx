"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Plus,
  ListTodo,
  CheckCircle2,
  Clock,
  Trash2,
  Calendar,
  Sun,
  Moon,
  Sunset,
  Flame,
  ArrowRight,
} from "lucide-react";
import { TaskList, Task } from "@/lib/db/schema";
import { TaskWithList } from "@/lib/repositories/task-repository";
import { useSession } from "@/lib/auth/auth-client";
import { FeatureSpacesGrid } from "@/components/feature-spaces-grid";
import { TodayFocusSection } from "@/components/today-focus-section";
import { QuickTaskModal } from "@/components/quick-task-modal";

interface TaskListWithCounts extends TaskList {
  taskCount: number;
  completedCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [lists, setLists] = useState<TaskListWithCounts[]>([]);
  const [tasks, setTasks] = useState<TaskWithList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Task Modal State
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskDueDate, setQuickTaskDueDate] = useState<Date | null>(null);

  // Dynamic Greeting
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        text: "Good morning",
        icon: <Sun className="w-5 h-5 text-amber-500" />,
        anchor: "Start your morning with a clear mind and focused intentions.",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: "Good afternoon",
        icon: <Sun className="w-5 h-5 text-amber-600" />,
        anchor:
          "Stay present. Tackle one priority at a time without cognitive overload.",
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        text: "Good evening",
        icon: <Sunset className="w-5 h-5 text-terracotta" />,
        anchor: "Wind down your open loops and reflect on today's progress.",
      };
    } else {
      return {
        text: "Quiet hours",
        icon: <Moon className="w-5 h-5 text-indigo-400" />,
        anchor: "Clear late-night thoughts to rest peacefully.",
      };
    }
  }, []);

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : null;

  // Load lists and all tasks
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [listsRes, tasksRes] = await Promise.all([
          fetch("/api/task-lists"),
          fetch("/api/tasks"),
        ]);

        if (!ignore) {
          if (listsRes.ok) {
            const listsData = await listsRes.json();
            setLists(listsData);
          }
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setTasks(tasksData);
          }
        }
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Handlers for task modifications
  const handleToggleTask = async (taskId: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    const newDone = !currentTask?.isDone;

    // Optimistic task state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isDone: newDone } : t)),
    );

    // Optimistic lists count update
    if (currentTask?.taskListId) {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id === currentTask.taskListId) {
            return {
              ...l,
              completedCount: newDone
                ? l.completedCount + 1
                : Math.max(0, l.completedCount - 1),
            };
          }
          return l;
        }),
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: newDone }),
      });
    } catch (e) {
      console.error("Failed to toggle task:", e);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
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
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (target?.taskListId) {
      setLists((prev) =>
        prev.map((l) => {
          if (l.id === target.taskListId) {
            return {
              ...l,
              taskCount: Math.max(0, l.taskCount - 1),
              completedCount: target.isDone
                ? Math.max(0, l.completedCount - 1)
                : l.completedCount,
            };
          }
          return l;
        }),
      );
    }

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete task:", e);
    }
  };

  const handleTaskCreated = (newTask: TaskWithList) => {
    setTasks((prev) => [newTask, ...prev]);

    // Update list count
    setLists((prev) => {
      const exists = prev.some((l) => l.id === newTask.taskListId);
      if (exists) {
        return prev.map((l) =>
          l.id === newTask.taskListId
            ? { ...l, taskCount: l.taskCount + 1 }
            : l,
        );
      } else {
        // Re-fetch lists if a new inbox list was automatically created
        fetch("/api/task-lists")
          .then((r) => r.json())
          .then((data) => setLists(data))
          .catch(console.error);
        return prev;
      }
    });
  };

  const handleDeleteList = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (
      !confirm("Are you sure you want to delete this list and all its tasks?")
    )
      return;

    try {
      const res = await fetch(`/api/task-lists/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== id));
        setTasks((prev) => prev.filter((t) => t.taskListId !== id));
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const handleOpenQuickTaskForToday = () => {
    const today = new Date();
    today.setHours(17, 0, 0, 0); // Default to 5 PM today
    setQuickTaskDueDate(today);
    setIsQuickTaskOpen(true);
  };

  const handleOpenGeneralQuickTask = () => {
    setQuickTaskDueDate(null);
    setIsQuickTaskOpen(true);
  };

  // Metrics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isDone).length;
  const pendingTasks = totalTasks - completedTasks;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const overdueCount = tasks.filter(
    (t) => t.dueDate && !t.isDone && new Date(t.dueDate) < startOfToday,
  ).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-12">
      {/* 1. Greeting & Daily Focus Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-linear-to-br from-card via-card to-background-subtle/50 border border-border shadow-xs">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            {greetingInfo.icon}
            <span>
              {greetingInfo.text}
              {userName ? `, ${userName}` : ""}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            Mindful Daily Command Center
          </h1>

          <p className="text-sm text-foreground-muted leading-relaxed">
            {greetingInfo.anchor}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link href="/dashboard/new">
            <Button
              variant="primary"
              size="md"
              className="shadow-sm shadow-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Brain Dump</span>
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenGeneralQuickTask}
            className="shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Task</span>
          </Button>

          <Link href="/dashboard/schedule">
            <Button variant="outline" size="md">
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Executive Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">
              Active Lists
            </span>
            <span className="text-2xl font-bold text-foreground mt-0.5">
              {lists.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">
              Pending Tasks
            </span>
            <span className="text-2xl font-bold text-foreground mt-0.5">
              {pendingTasks}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">
              Completed
            </span>
            <span className="text-2xl font-bold text-foreground mt-0.5">
              {completedTasks}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">
              Needs Attention
            </span>
            <span
              className={`text-2xl font-bold mt-0.5 ${overdueCount > 0 ? "text-destructive" : "text-foreground"}`}
            >
              {overdueCount}
            </span>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              overdueCount > 0
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-background-subtle text-foreground-muted"
            }`}
          >
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Today's Focus & Urgent Tasks Section */}
      <TodayFocusSection
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onOpenQuickTaskForToday={handleOpenQuickTaskForToday}
        isLoading={isLoading}
      />

      {/* 4. Workspace Feature Spaces Navigation Grid */}
      <FeatureSpacesGrid />

      {/* 5. Recent Lists & Quick Progress Section */}
      <div id="task-lists" className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Project Lists &amp; Checklists
            </h2>
          </div>
          <span className="text-xs text-foreground-muted font-medium">
            {lists.length} lists
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-card border border-border animate-pulse-subtle"
              />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                No project lists yet
              </h3>
              <p className="text-xs text-foreground-muted">
                Dump whatever thoughts or plans are bouncing in your head, and
                let Untangle turn them into clean, structured tasks.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/dashboard/new">
                <Button variant="primary" size="md">
                  <Sparkles className="w-4 h-4" />
                  <span>Start a Brain Dump</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="md"
                onClick={handleOpenGeneralQuickTask}
              >
                <Plus className="w-4 h-4" />
                <span>Quick Task</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list) => {
              const progress =
                list.taskCount > 0
                  ? Math.round((list.completedCount / list.taskCount) * 100)
                  : 0;
              const formattedDate = new Date(list.createdAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                },
              );

              return (
                <Link
                  key={list.id}
                  href={`/dashboard/${list.id}`}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {list.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteList(e, list.id)}
                          className="text-foreground-muted/40 hover:text-destructive p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {list.summary && (
                      <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                        {list.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-foreground-muted">
                      <span>
                        {list.completedCount}/{list.taskCount} tasks done (
                        {progress}%)
                      </span>
                      <span>{formattedDate}</span>
                    </div>

                    <div className="w-full h-1.5 bg-background-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Task Modal */}
      {isQuickTaskOpen && (
        <QuickTaskModal
          isOpen={isQuickTaskOpen}
          onClose={() => setIsQuickTaskOpen(false)}
          lists={lists.map((l) => ({ id: l.id, title: l.title }))}
          defaultDueDate={quickTaskDueDate}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
