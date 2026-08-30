"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, ListTodo, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { TaskList } from "@/lib/db/schema";

interface TaskListWithCounts extends TaskList {
  taskCount: number;
  completedCount: number;
}

export default function DashboardPage() {
  const [lists, setLists] = useState<TaskListWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/task-lists");
        if (res.ok && !ignore) {
          const data = await res.json();
          setLists(data);
        }
      } catch (e) {
        console.error("Failed to load task lists:", e);
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

  const handleDeleteList = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this list and all its tasks?")) return;

    try {
      const res = await fetch(`/api/task-lists/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  // Metrics calculation
  const totalTasks = lists.reduce((acc, l) => acc + (l.taskCount || 0), 0);
  const completedTasks = lists.reduce((acc, l) => acc + (l.completedCount || 0), 0);
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Your Untangled Workspace
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Organize, prioritize, and conquer your day without the mental friction.
          </p>
        </div>

        <Link href="/dashboard/new">
          <Button variant="primary" size="md" className="shrink-0 shadow-sm shadow-primary/20">
            <Sparkles className="w-4 h-4" />
            <span>New Brain Dump</span>
          </Button>
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">Active Lists</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{lists.length}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">Pending Tasks</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{pendingTasks}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-foreground-muted font-medium">Completed Tasks</span>
            <span className="text-2xl font-bold text-foreground mt-0.5">{completedTasks}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Task Lists Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Task Lists</h2>
          <span className="text-xs text-foreground-muted">{lists.length} lists</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-card border border-border animate-pulse-subtle" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">No task lists yet</h3>
              <p className="text-xs text-foreground-muted">
                Dump whatever thoughts or tasks are on your mind and let Untangle break them down for you.
              </p>
            </div>
            <Link href="/dashboard/new">
              <Button variant="primary" size="md" className="mt-2">
                <Plus className="w-4 h-4" />
                <span>Create Your First List</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list) => {
              const progress =
                list.taskCount > 0 ? Math.round((list.completedCount / list.taskCount) * 100) : 0;
              const formattedDate = new Date(list.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <Link
                  key={list.id}
                  href={`/dashboard/${list.id}`}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {list.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteList(e, list.id)}
                        className="text-foreground-muted/40 hover:text-destructive p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                        {list.completedCount}/{list.taskCount} tasks done ({progress}%)
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
    </div>
  );
}
