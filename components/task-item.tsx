"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Task } from "@/lib/db/schema";
import { Badge } from "./ui/badge";
import { DateTimePicker } from "./ui/date-time-picker";
import { Check, Trash2, Edit2, Calendar, Sparkles, ArrowRight } from "lucide-react";

interface TaskItemProps {
  task: Task & { listTitle?: string };
  onToggle: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  listTitle?: string;
  taskListId?: string;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete, listTitle, taskListId }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState<Date | null>(task.dueDate ? new Date(task.dueDate) : null);
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task.priority === "high" || task.priority === "low" ? task.priority : "medium"
  );

  const resolvedListTitle = listTitle || task.listTitle;
  const resolvedTaskListId = taskListId || task.taskListId;

  const startEditing = () => {
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setPriority(task.priority === "high" || task.priority === "low" ? task.priority : "medium");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsEditing(false);
    await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      dueDate,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setIsEditing(false);
    }
  };

  const formatScheduledTime = (dateVal: string | Date | null) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    const datePart = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    if (!hasTime) return datePart;

    const timePart = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${datePart} • ${timePart}`;
  };

  const formattedDueDate = formatScheduledTime(task.dueDate);

  const isOverdue =
    task.dueDate && !task.isDone && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div
      className={`group p-4 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${
        task.isDone
          ? "bg-background-subtle/30 border-border/50 opacity-60"
          : "bg-card border-border hover:border-primary/40 shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-label={task.isDone ? "Mark as active" : "Mark as completed"}
          className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            task.isDone
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-border hover:border-primary bg-background hover:bg-background-subtle"
          }`}
        >
          {task.isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-medium text-foreground bg-background-subtle border border-border rounded-md px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                      onClick={() => setPriority(p)}
                      className={`text-xs px-2 py-0.5 rounded-full capitalize border ${
                        priority === p
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground-muted border-border"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <DateTimePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Set due date & time..."
                  align="right"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-foreground-muted hover:text-foreground px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md font-medium shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  onClick={startEditing}
                  className={`text-sm font-semibold leading-snug cursor-pointer transition-colors hover:text-primary ${
                    task.isDone ? "line-through text-foreground-muted" : "text-foreground"
                  }`}
                >
                  {task.title}
                </span>

                {/* List Title Badge Placed Directly Next to Task Title */}
                {resolvedListTitle && (
                  <Link
                    href={`/dashboard/${resolvedTaskListId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-foreground-muted hover:text-primary transition-colors inline-flex items-center gap-1 font-medium bg-background-subtle hover:bg-border-muted px-2 py-0.5 rounded-md border border-border/50 shrink-0"
                    title={`View list: ${resolvedListTitle}`}
                  >
                    <span>{resolvedListTitle}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                )}
              </div>

              {task.description && (
                <div className="flex items-start gap-1.5 text-xs text-foreground-muted bg-background-subtle/60 rounded-lg p-2 border border-border/40">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed whitespace-pre-line text-foreground-muted">
                    {task.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Meta Badges */}
          {!isEditing && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={task.priority === "high" || task.priority === "low" ? task.priority : "medium"}>
                {task.priority}
              </Badge>

              {formattedDueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    isOverdue
                      ? "bg-red-500/10 text-red-700 dark:text-red-400 font-semibold"
                      : "text-foreground-muted bg-background-subtle"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDueDate}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={startEditing}
              className="p-1 text-foreground-muted hover:text-foreground rounded transition-colors cursor-pointer"
              title="Edit task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-1 text-foreground-muted hover:text-destructive rounded transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
