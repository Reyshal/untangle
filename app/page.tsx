"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { AiInputCard } from "@/components/ai-input-card";
import { TaskDraftPreview } from "@/components/task-draft-preview";
import { TaskBreakdownResult, TaskDraftItem } from "@/lib/ai/schemas";
import { Sparkles, CheckCircle2, Zap, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<TaskBreakdownResult | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleBreakdown = async (text: string, language?: string) => {
    setIsLoading(true);
    setRawInput(text);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");
      setDraft(data);
      setSavedSuccess(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to untangle tasks";
      console.error(err);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDemo = async (finalData: {
    title: string;
    rawInput: string;
    summary?: string;
    tasks: TaskDraftItem[];
  }) => {
    try {
      const res = await fetch("/api/task-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });
      if (res.ok) {
        setSavedSuccess(true);
      }
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent-subtle-foreground border border-accent-subtle-border text-xs font-semibold tracking-wide uppercase animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>AI Task Decomposition</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-2xl leading-[1.15]">
            Turn chaotic thoughts into <span className="text-primary underline decoration-primary/30 underline-offset-8">clear action</span>.
          </h1>

          <p className="text-base sm:text-xl text-foreground-muted max-w-xl leading-relaxed">
            Dump your messy thoughts, stream-of-consciousness notes, or project plans. Untangle structures, prioritizes, and organizes them in seconds.
          </p>
        </section>

        {/* Live Interactive Sandbox Box */}
        <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <div className="relative">
            {/* Subtle glow border effect */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-amber-500/20 to-primary/20 blur-xl opacity-50 -z-10" />

            {!draft ? (
              <AiInputCard onSubmit={handleBreakdown} isLoading={isLoading} />
            ) : savedSuccess ? (
              <div className="p-8 rounded-2xl bg-card border border-border text-center flex flex-col items-center gap-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Saved to your Untangle workspace!</h3>
                <p className="text-sm text-foreground-muted max-w-md">
                  Your tasks have been persisted. You can manage them in your dashboard anytime.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link href="/dashboard">
                    <Button variant="primary" size="md">
                      Open Dashboard
                    </Button>
                  </Link>
                  <Button variant="secondary" size="md" onClick={() => setDraft(null)}>
                    Untangle Another
                  </Button>
                </div>
              </div>
            ) : (
              <TaskDraftPreview
                draft={draft}
                rawInput={rawInput}
                onSave={handleSaveDemo}
                onReset={() => setDraft(null)}
                isSaving={false}
              />
            )}
          </div>
        </section>

        {/* Features / Why Untangle */}
        <section className="w-full border-t border-border bg-background-subtle/50 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-center text-xs font-bold uppercase tracking-wider text-primary mb-3">
              How It Works
            </h2>
            <p className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-12">
              Calm productivity without tedious manual entry
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">1. Brain Dump</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  Write freely without worrying about formatting, bullet points, or nesting. Just write what you need to do.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">2. AI Decomposes</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  DeepSeek extracts imperative actions, estimates priorities (High, Medium, Low), and detects due dates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-500/10 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">3. Preview & Refine</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  Review and tweak tasks before saving. Nothing touches your database without your confirmation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-foreground-muted">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">untangle.</span>
            <span>— AI task breakdown for thoughtful minds</span>
          </div>
          <div>Built with Next.js 16, React 19, Better Auth & DeepSeek.</div>
        </div>
      </footer>
    </div>
  );
}
