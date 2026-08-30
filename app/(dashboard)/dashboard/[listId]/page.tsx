"use client";

import React, { use, useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TaskItem } from "@/components/task-item";
import { TaskFilterBar, SortRule, SortKey, SortDirection } from "@/components/task-filter-bar";
import { TaskDraftPreview } from "@/components/task-draft-preview";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { LanguageSelect } from "@/components/ui/language-select";
import { Button } from "@/components/ui/button";
import { TaskList, Task } from "@/lib/db/schema";
import { TaskBreakdownResult, TaskDraftItem } from "@/lib/ai/schemas";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  FileText,
  Copy,
  ChevronDown,
  Sparkles,
  Save,
  X,
  Calendar,
} from "lucide-react";

interface SingleListPageProps {
  params: Promise<{ listId: string }>;
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

function SingleListContent({ listId }: { listId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [list, setList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [showRawNotes, setShowRawNotes] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Raw notes editing & AI Re-decomposition state
  const [isEditingRawNotes, setIsEditingRawNotes] = useState(false);
  const [rawNotesInput, setRawNotesInput] = useState("");
  const [rawNotesLanguage, setRawNotesLanguage] = useState("auto");
  const [rawNotesAutoSchedule, setRawNotesAutoSchedule] = useState(true);
  const [isReBreakingDown, setIsReBreakingDown] = useState(false);
  const [reBreakdownDraft, setReBreakdownDraft] = useState<TaskBreakdownResult | null>(null);
  const [isSavingReBreakdown, setIsSavingReBreakdown] = useState(false);

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);

  // Filters & Sorting directly from searchParams
  const searchQuery = searchParams.get("q") || "";
  const priorityFilter = (searchParams.get("priority") as "all" | "high" | "medium" | "low") || "all";
  const statusFilter = (searchParams.get("status") as "all" | "active" | "completed") || "all";
  const activeSorts = parseSortRules(searchParams.get("sort"));

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
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
        const res = await fetch(`/api/task-lists/${listId}`);
        if (res.ok && !ignore) {
          const data = await res.json();
          setList(data);
          setTitleInput(data.title);
          setRawNotesInput(data.rawInput || "");
          setTasks(data.tasks || []);
        } else if (res.status === 404 && !ignore) {
          router.push("/dashboard");
        }
      } catch (e) {
        console.error("Failed to load list details:", e);
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
  }, [listId, router]);

  const handleUpdateTitle = async () => {
    if (!titleInput.trim() || titleInput === list?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/task-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleInput }),
      });
      if (res.ok) {
        const updated = await res.json();
        setList((prev) => (prev ? { ...prev, title: updated.title } : prev));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleSaveRawNotesOnly = async () => {
    try {
      const res = await fetch(`/api/task-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawNotesInput }),
      });
      if (res.ok) {
        setList((prev) => (prev ? { ...prev, rawInput: rawNotesInput } : prev));
        setIsEditingRawNotes(false);
      }
    } catch (e) {
      console.error("Failed to update raw notes:", e);
    }
  };

  const handleTriggerReBreakdown = async () => {
    if (!rawNotesInput.trim()) return;
    setIsReBreakingDown(true);

    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawNotesInput,
          language: rawNotesLanguage,
          autoSchedule: rawNotesAutoSchedule,
          clientDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to re-decompose tasks");
      }

      setReBreakdownDraft(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to re-decompose brain dump";
      console.error(err);
      alert(msg);
    } finally {
      setIsReBreakingDown(false);
    }
  };

  const handleSaveReBreakdown = async (finalData: {
    title: string;
    rawInput: string;
    summary?: string;
    tasks: TaskDraftItem[];
  }) => {
    setIsSavingReBreakdown(true);
    try {
      const res = await fetch(`/api/task-lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.error || "Failed to update task list with new tasks");
      }

      setList(updated);
      setTitleInput(updated.title);
      setRawNotesInput(updated.rawInput || "");
      setTasks(updated.tasks || []);
      setReBreakdownDraft(null);
      setIsEditingRawNotes(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save re-decomposed tasks";
      console.error(err);
      alert(msg);
    } finally {
      setIsSavingReBreakdown(false);
    }
  };

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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskListId: listId,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          priority: newTaskPriority,
          dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [...prev, created]);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskDueDate(null);
        setIsAddingTask(false);
      }
    } catch (e) {
      console.error("Failed to add task:", e);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm("Are you sure you want to permanently delete this task list?")) return;
    try {
      const res = await fetch(`/api/task-lists/${listId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Failed to delete list:", e);
    }
  };

  const handleCopyMarkdown = () => {
    if (!list) return;
    const md = `# ${list.title}\n\n${tasks
      .map((t) => `- [${t.isDone ? "x" : " "}] **${t.title}** (${t.priority})${t.description ? `\n  ${t.description}` : ""}`)
      .join("\n")}`;

    navigator.clipboard.writeText(md);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // 1-Click Smart Sorting Handler
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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    if (statusFilter === "active" && task.isDone) return false;
    if (statusFilter === "completed" && !task.isDone) return false;

    return true;
  });

  // Sort tasks
  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
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
    return a.sortOrder - b.sortOrder;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isDone).length;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-pulse-subtle">
        <div className="h-6 w-32 bg-card rounded-md border border-border" />
        <div className="h-10 w-3/4 bg-card rounded-lg border border-border" />
        <div className="h-64 bg-card rounded-2xl border border-border" />
      </div>
    );
  }

  if (!list) return null;

  // If in Re-decomposition draft review mode, show the interactive draft preview
  if (reBreakdownDraft) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-20">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setReBreakdownDraft(null)}
            className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel Re-decomposition</span>
          </button>
        </div>

        <TaskDraftPreview
          draft={reBreakdownDraft}
          rawInput={rawNotesInput}
          onSave={handleSaveReBreakdown}
          onReset={() => setReBreakdownDraft(null)}
          isSaving={isSavingReBreakdown}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/dashboard");
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyMarkdown}
            title="Copy as Markdown"
            className="text-xs"
          >
            {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSuccess ? "Copied!" : "Export"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteList}
            title="Delete list"
            className="text-xs text-foreground-muted hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* List Header */}
      <div className="flex flex-col gap-2 pb-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
              onBlur={handleUpdateTitle}
              autoFocus
              className="text-2xl sm:text-3xl font-extrabold text-foreground bg-background-subtle border border-border rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-primary w-full"
            />
            <Button size="sm" variant="secondary" onClick={handleUpdateTitle}>
              Save
            </Button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => setIsEditingTitle(true)}
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {list.title}
            </h1>
            <Edit2 className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {list.summary && (
          <p className="text-sm text-foreground-muted leading-relaxed">{list.summary}</p>
        )}

        {/* Collapsible original raw notes & Re-decomposition */}
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowRawNotes(!showRawNotes)}
            className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground font-medium transition-colors cursor-pointer select-none"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {showRawNotes
                ? "Hide original brain dump"
                : list.rawInput
                ? "View / edit original brain dump"
                : "Add brain dump notes"}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                showRawNotes ? "rotate-180" : ""
              }`}
            />
          </button>

          {showRawNotes && (
            <div className="mt-2 p-4 rounded-xl bg-card border border-border flex flex-col gap-3 shadow-xs animate-fade-in">
              {isEditingRawNotes ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Edit Brain Dump & Re-decompose
                    </span>
                    <LanguageSelect
                      value={rawNotesLanguage}
                      onChange={setRawNotesLanguage}
                    />
                  </div>

                  <textarea
                    value={rawNotesInput}
                    onChange={(e) => setRawNotesInput(e.target.value)}
                    placeholder="Type or paste your messy thoughts, notes, or routine here..."
                    rows={6}
                    autoFocus
                    className="w-full p-3 rounded-lg bg-background-subtle border border-border text-xs text-foreground leading-relaxed outline-none focus:ring-2 focus:ring-primary resize-y font-mono"
                  />

                  {/* Auto-detect Dates Checkbox */}
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-foreground-muted hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={rawNotesAutoSchedule}
                        onChange={(e) => setRawNotesAutoSchedule(e.target.checked)}
                        disabled={isReBreakingDown}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 accent-primary cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary/80" />
                        <span>Auto-detect dates & times with AI</span>
                      </span>
                    </label>

                    <span className="text-[11px] text-foreground-muted/60 hidden sm:inline">
                      {rawNotesAutoSchedule ? "AI infers deadlines & times" : "Tasks will be undated (manual only)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setIsEditingRawNotes(false);
                        setRawNotesInput(list.rawInput || "");
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={handleSaveRawNotesOnly}
                        title="Save notes without re-running AI"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save Notes
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        type="button"
                        isLoading={isReBreakingDown}
                        disabled={!rawNotesInput.trim() || isReBreakingDown}
                        onClick={handleTriggerReBreakdown}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-decompose with AI</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-lg bg-background-subtle border border-border/70 text-xs text-foreground-muted leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                    {list.rawInput || "No brain dump text recorded yet."}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => setIsEditingRawNotes(true)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit & Re-decompose</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter, Sorting, and Progress Bar */}
      <TaskFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => updateUrlParams({ q: q.trim() ? q : null })}
        priorityFilter={priorityFilter}
        onPriorityChange={(p) => updateUrlParams({ priority: p })}
        statusFilter={statusFilter}
        onStatusChange={(s) => updateUrlParams({ status: s })}
        activeSorts={activeSorts}
        onToggleSort={handleToggleSort}
        onResetSort={handleResetSort}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
      />

      {/* Task Rows */}
      <div className="flex flex-col gap-2.5">
        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-card border border-border text-xs text-foreground-muted">
            No tasks match the active filters.
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}

        {/* Add Task Form */}
        {isAddingTask ? (
          <form
            onSubmit={handleAddTask}
            className="p-4 rounded-xl bg-card border border-primary/50 shadow-xs flex flex-col gap-2.5 animate-fade-in"
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to get done?"
              autoFocus
              className="font-medium text-foreground bg-background-subtle border border-border rounded-md px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Note, context or tip..."
              rows={2}
              className="text-xs text-foreground bg-background-subtle border border-border rounded-md px-2.5 py-1 outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-1">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={`text-xs px-2 py-0.5 rounded-full capitalize border transition-all cursor-pointer ${
                      newTaskPriority === p
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-foreground-muted border-border hover:bg-background-subtle"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <DateTimePicker
                value={newTaskDueDate}
                onChange={setNewTaskDueDate}
                placeholder="Set due date & time..."
                align="right"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setNewTaskPriority("medium");
                  setNewTaskDueDate(null);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit" disabled={!newTaskTitle.trim()}>
                Add Task
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTask(true)}
            className="p-3 border border-dashed border-border rounded-xl text-xs text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function SingleListPage({ params }: SingleListPageProps) {
  const resolvedParams = use(params);
  const listId = resolvedParams.listId;

  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-pulse-subtle">
          <div className="h-6 w-32 bg-card rounded-md border border-border" />
          <div className="h-10 w-3/4 bg-card rounded-lg border border-border" />
          <div className="h-64 bg-card rounded-2xl border border-border" />
        </div>
      }
    >
      <SingleListContent listId={listId} />
    </Suspense>
  );
}
