"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AiInputCard } from "@/components/ai-input-card";
import { TaskDraftPreview } from "@/components/task-draft-preview";
import { TaskBreakdownResult, TaskDraftItem } from "@/lib/ai/schemas";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NewBrainDumpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<TaskBreakdownResult | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBreakdown = async (
    text: string,
    language?: string,
    autoSchedule?: boolean,
    clientDate?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setRawInput(text);

    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language,
          autoSchedule,
          clientDate: clientDate || new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to decompose tasks");
      }

      setDraft(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during breakdown.";
      console.error(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (finalData: {
    title: string;
    rawInput: string;
    summary?: string;
    tasks: TaskDraftItem[];
  }) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/task-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save task list");
      }

      // Redirect to the newly created list detail view
      router.push(`/dashboard/${result.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save tasks";
      console.error(err);
      alert(msg);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Top navigation */}
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
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <span>Untangle a Brain Dump</span>
          <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-sm text-foreground-muted">
          Type or paste your unstructured thoughts. DeepSeek will parse them into discrete, prioritized tasks.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Main card or Preview */}
      {!draft ? (
        <div className="relative">
          <AiInputCard onSubmit={handleBreakdown} isLoading={isLoading} initialValue={rawInput} />
        </div>
      ) : (
        <TaskDraftPreview
          draft={draft}
          rawInput={rawInput}
          onSave={handleSave}
          onReset={() => setDraft(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
