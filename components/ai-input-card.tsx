"use client";

import React, { useState } from "react";
import { Sparkles, CornerDownLeft, Lightbulb, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { LanguageSelect } from "./ui/language-select";

interface AiInputCardProps {
  onSubmit: (text: string, language?: string, autoSchedule?: boolean, clientDate?: string) => Promise<void> | void;
  isLoading: boolean;
  initialValue?: string;
}

const SAMPLE_PROMPTS = [
  "Plan weekend chores: wash car, buy groceries for pasta night, fix bike tire, return library books before 4pm",
  "Launch beta next Tuesday: write release notes, record a 2-min demo video, email test users, check stripe webhooks",
  "Prep for tech interview: review DSA graph algorithms, practice system design for URL shortener, polish resume intro",
];

export function AiInputCard({ onSubmit, isLoading, initialValue = "" }: AiInputCardProps) {
  const [text, setText] = useState(initialValue);
  const [language, setLanguage] = useState("auto");
  const [autoSchedule, setAutoSchedule] = useState(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSubmit(text, language, autoSchedule, new Date().toISOString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-card rounded-2xl border border-border p-5 sm:p-7 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-ring">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Header with Title, Auto-schedule Checkbox, and Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <label htmlFor="brain-dump" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Brain Dump / Raw Notes</span>
          </label>

          <div className="flex items-center flex-wrap gap-3">
            {/* Custom Output Language Selector */}
            <LanguageSelect
              value={language}
              onChange={setLanguage}
              disabled={isLoading}
            />

            <span className="text-xs text-foreground-muted hidden md:inline">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background-subtle border border-border rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background-subtle border border-border rounded">Enter</kbd>
            </span>
          </div>
        </div>

        <textarea
          id="brain-dump"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Dump whatever is in your head... (e.g. need to prepare presentation slides for team meeting on Thursday, call landlord about the water heater, order cat food, review pull request #42)"
          className="w-full bg-transparent border-0 resize-none outline-none text-foreground placeholder:text-foreground-muted/60 text-base leading-relaxed"
          disabled={isLoading}
          autoFocus
        />

        {/* AI Date & Time Auto-Scheduling Checkbox Option */}
        <div className="flex items-center justify-between pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-foreground-muted hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={autoSchedule}
              onChange={(e) => setAutoSchedule(e.target.checked)}
              disabled={isLoading}
              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/40 accent-primary cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary/80" />
              <span>Auto-detect dates & times with AI</span>
            </span>
          </label>

          <span className="text-[11px] text-foreground-muted/60 hidden sm:inline">
            {autoSchedule ? "AI will infer deadlines & times" : "Tasks will be undated (manual only)"}
          </span>
        </div>

        <div className="pt-2 border-t border-border-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Sample Prompts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-foreground-muted flex items-center gap-1 mr-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Try:
            </span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setText(sample)}
                disabled={isLoading}
                className="text-xs bg-background-subtle hover:bg-border-muted border border-border-muted text-foreground-muted hover:text-foreground px-2.5 py-1 rounded-md transition-colors cursor-pointer text-left truncate max-w-[200px] sm:max-w-[240px]"
                title={sample}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            disabled={!text.trim()}
            className="w-full sm:w-auto shrink-0 font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>Untangle Tasks</span>
            <CornerDownLeft className="w-3.5 h-3.5 opacity-60 hidden sm:inline" />
          </Button>
        </div>
      </form>
    </div>
  );
}
