"use client";

import React, { useState } from "react";
import { TaskBreakdownResult, TaskDraftItem } from "@/lib/ai/schemas";
import { Button } from "./ui/button";
import { DateTimePicker } from "./ui/date-time-picker";
import { Check, Plus, Trash2, Edit2, ArrowRight, RotateCcw, Sparkles } from "lucide-react";

interface TaskDraftPreviewProps {
  draft: TaskBreakdownResult;
  rawInput: string;
  onSave: (finalData: { title: string; rawInput: string; summary?: string; tasks: TaskDraftItem[] }) => Promise<void> | void;
  onReset: () => void;
  isSaving: boolean;
}

export function TaskDraftPreview({ draft, rawInput, onSave, onReset, isSaving }: TaskDraftPreviewProps) {
  const [title, setTitle] = useState(draft.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tasks, setTasks] = useState<TaskDraftItem[]>(() =>
    draft.tasks.map((t, i) => ({ ...t, id: t.id || `draft-task-${i}` }))
  );

  const handleUpdateTask = (id: string, updates: Partial<TaskDraftItem>) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddTask = () => {
    const newTask: TaskDraftItem = {
      id: `draft-custom-${Math.random().toString(36).substring(2, 9)}`,
      title: "New actionable task",
      description: "Step-by-step focus: start small to build momentum.",
      priority: "medium",
      dueDate: null,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleSave = () => {
    if (!title.trim() || tasks.length === 0) return;

    // Normalize all dates to client-timezone ISO strings before sending to API
    const normalizedTasks: TaskDraftItem[] = tasks.map((t) => {
      let finalDue: string | null = null;
      if (t.dueDate) {
        const d = typeof t.dueDate === "string" ? new Date(t.dueDate) : t.dueDate;
        if (d && !isNaN(d.getTime())) {
          finalDue = d.toISOString();
        }
      }
      return {
        ...t,
        dueDate: finalDue,
      };
    });

    onSave({
      title,
      rawInput,
      summary: draft.summary,
      tasks: normalizedTasks,
    });
  };

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-5 sm:p-7 shadow-sm animate-fade-in flex flex-col gap-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Breakdown Preview
            </span>
            <span className="text-xs text-foreground-muted">• {tasks.length} tasks ready</span>
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                autoFocus
                className="text-xl font-bold text-foreground bg-background-subtle border border-border rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary w-full max-w-md"
              />
              <Button size="sm" variant="secondary" onClick={() => setIsEditingTitle(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
              <Edit2 className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {draft.summary && (
            <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{draft.summary}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={isSaving}>
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Over</span>
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving} disabled={tasks.length === 0}>
            <Check className="w-4 h-4" />
            <span>Save to Lists</span>
          </Button>
        </div>
      </div>

      {/* Task Items List */}
      <div className="flex flex-col gap-3">
        {tasks.map((task, index) => (
          <div
            key={task.id || index}
            className="group p-3.5 sm:p-4 rounded-xl bg-background-subtle/50 hover:bg-background-subtle border border-border/80 transition-all flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleUpdateTask(task.id!, { title: e.target.value })}
                  placeholder="Task title..."
                  className="font-medium text-foreground bg-transparent border-0 outline-none text-base focus:border-b focus:border-primary px-0 py-0.5"
                />

                {/* Context Note / Tip Input */}
                <div className="flex items-center gap-1.5 bg-background/50 rounded-lg px-2.5 py-1.5 border border-border/60 focus-within:border-primary/50 focus-within:bg-background transition-all mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <input
                    type="text"
                    value={task.description || ""}
                    onChange={(e) => handleUpdateTask(task.id!, { description: e.target.value || null })}
                    placeholder="AI note, context, or motivational tip..."
                    className="text-xs text-foreground bg-transparent border-0 outline-none placeholder:text-foreground-muted/50 w-full"
                  />
                </div>
              </div>

              {/* Delete task button */}
              <button
                type="button"
                onClick={() => handleRemoveTask(task.id!)}
                className="text-foreground-muted/60 hover:text-destructive p-1 rounded-md transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                title="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Task Meta (Priority & Date/Time Scheduling) */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              {/* Priority Selector */}
              <div className="flex items-center gap-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleUpdateTask(task.id!, { priority: p })}
                    className={`text-xs px-2.5 py-0.5 rounded-full capitalize border transition-colors cursor-pointer ${
                      task.priority === p
                        ? p === "high"
                          ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40 font-semibold"
                          : p === "medium"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 font-semibold"
                          : "bg-stone-500/20 text-stone-700 dark:text-stone-300 border-stone-500/40 font-semibold"
                        : "bg-transparent text-foreground-muted border-transparent hover:border-border"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Clean Date & Time Picker */}
              <DateTimePicker
                value={task.dueDate ? new Date(task.dueDate) : null}
                onChange={(date) =>
                  handleUpdateTask(task.id!, {
                    dueDate: date ? date.toISOString() : null,
                  })
                }
                placeholder="Schedule date & time..."
                align="right"
              />
            </div>
          </div>
        ))}

        {/* Add new task button */}
        <button
          type="button"
          onClick={handleAddTask}
          className="p-3 border border-dashed border-border rounded-xl text-sm text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add another task to this list</span>
        </button>
      </div>

      {/* Footer Confirm */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <p className="text-xs text-foreground-muted">
          All tasks and scheduled times can still be edited or checked off anytime.
        </p>
        <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving} disabled={tasks.length === 0}>
          <span>Save to My Lists</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
