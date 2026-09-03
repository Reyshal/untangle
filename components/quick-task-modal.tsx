"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { DateTimePicker } from "./ui/date-time-picker";
import { CustomSelect, CustomSelectOption } from "./ui/custom-select";
import { TaskWithList } from "@/lib/repositories/task-repository";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  X,
  Sparkles,
  Plus,
  ListTodo,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: Array<{ id: string; title: string }>;
  defaultDueDate?: Date | null;
  onTaskCreated: (newTask: TaskWithList) => void;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  lists,
  defaultDueDate = null,
  onTaskCreated,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>(
    () => lists[0]?.id || "",
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const isClient = useIsClient();
  useBodyScrollLock(isOpen);

  const handleClose = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [isClosing, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, handleClose]);

  if (!isOpen || !isClient) return null;

  const listOptions: CustomSelectOption[] = [
    ...(lists.length > 0
      ? lists.map((l) => ({
          value: l.id,
          label: l.title,
          icon: <ListTodo className="w-3.5 h-3.5 text-primary" />,
        }))
      : [
          {
            value: "",
            label: "Inbox (Auto-create)",
            icon: <ListTodo className="w-3.5 h-3.5 text-primary" />,
          },
        ]),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          taskListId: selectedListId || undefined,
          dueDate: dueDate ? dueDate.toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      const created = await res.json();
      // Match list title for immediate rendering
      const matchingList = lists.find(
        (l) => l.id === (selectedListId || created.taskListId),
      );
      const enrichedTask: TaskWithList = {
        ...created,
        listTitle: matchingList ? matchingList.title : "Inbox",
      };

      onTaskCreated(enrichedTask);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create task";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-hidden ${
        isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-card border-t sm:border border-border shadow-2xl p-5 sm:p-6 pb-8 sm:pb-6 relative flex flex-col gap-5 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto ${
          isClosing
            ? "animate-slide-down sm:animate-fade-out"
            : "animate-slide-up sm:animate-fade-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-foreground-muted/30 rounded-full mx-auto sm:hidden shrink-0 -mt-1 mb-0.5" />

        {/* Top Accent Gradient Line (Desktop) */}
        <div className="hidden sm:block absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-amber-500 to-terracotta" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Quick Add Task
              </h2>
              <p className="text-xs text-foreground-muted">
                Capture an immediate action item directly to your daily queue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-foreground-muted hover:text-foreground p-1 rounded-lg hover:bg-background-subtle transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="quick-task-title"
              className="text-xs font-semibold text-foreground"
            >
              Task Title <span className="text-primary">*</span>
            </label>
            <input
              id="quick-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full text-sm font-medium text-foreground bg-background-subtle border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Description / Note */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="quick-task-desc"
              className="text-xs font-semibold text-foreground"
            >
              Notes or Context{" "}
              <span className="text-foreground-muted font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="quick-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, link, or sub-step..."
              rows={2}
              className="w-full text-xs text-foreground bg-background-subtle border border-border rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Destination List & Priority Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* List Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target List
              </label>
              <CustomSelect
                value={selectedListId}
                onChange={setSelectedListId}
                options={listOptions}
                placeholder="Choose list"
                className="w-full"
              />
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Priority
              </label>
              <div className="flex items-center gap-1.5 h-8">
                {(["low", "medium", "high"] as const).map((p) => {
                  const isActive = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize border transition-all cursor-pointer ${
                        isActive
                          ? p === "high"
                            ? "bg-red-500/15 border-red-500 text-red-700 dark:text-red-400 font-semibold shadow-xs"
                            : p === "low"
                              ? "bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-400 font-semibold shadow-xs"
                              : "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-background-subtle text-foreground-muted border-border hover:text-foreground hover:bg-border-muted"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-foreground-muted" />
              <span>Schedule Due Date & Time</span>
            </label>
            <div className="flex items-center gap-2">
              <DateTimePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select date & time (e.g., Today at 5 PM)"
                align="left"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate(null)}
                  className="text-xs text-foreground-muted hover:text-destructive px-2 py-1 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !title.trim()}
              className="shadow-sm shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Add Task"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
