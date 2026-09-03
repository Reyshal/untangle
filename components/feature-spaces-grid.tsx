"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  Sparkles,
  Calendar,
  ListTodo,
  FileEdit,
  BookOpen,
  ArrowUpRight,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";

interface PreviewModalInfo {
  title: string;
  icon: React.ReactNode;
  badge: string;
  tagline: string;
  highlights: string[];
  roadmapPhase: string;
}

export function FeatureSpacesGrid() {
  const [activePreview, setActivePreview] = useState<PreviewModalInfo | null>(
    null,
  );
  const [isClosing, setIsClosing] = useState(false);
  const isClient = useIsClient();
  useBodyScrollLock(!!activePreview);

  const handleClosePreview = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setActivePreview(null);
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePreview) {
        if (!isClosing) {
          setIsClosing(true);
          setTimeout(() => {
            setIsClosing(false);
            setActivePreview(null);
          }, 200);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePreview, isClosing]);

  const modules = [
    {
      id: "brain-dump",
      title: "AI Brain Dump",
      tagline:
        "Deconstruct chaotic thoughts into prioritized, scheduled tasks.",
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      accentBg:
        "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
      href: "/dashboard/new",
      isLive: true,
      badge: "AI Powered",
      badgeVariant: "primary" as const,
    },
    {
      id: "schedule",
      title: "Schedule & Agenda",
      tagline:
        "Unified chronological timeline, 1-click sorting, and smart filters.",
      icon: <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      accentBg:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white",
      href: "/dashboard/schedule",
      isLive: true,
      badge: "Agenda",
      badgeVariant: "default" as const,
    },
    {
      id: "task-lists",
      title: "Project Lists",
      tagline:
        "Structured task lists, progress tracking, and re-decomposition.",
      icon: (
        <ListTodo className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      ),
      accentBg:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
      href: "#task-lists",
      isLive: true,
      badge: "Projects",
      badgeVariant: "default" as const,
    },
    {
      id: "scribbles",
      title: "Scribbles Scratchpad",
      tagline:
        "Zero-friction raw thoughts with an agentic AI writing assistant & diff review.",
      icon: (
        <FileEdit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      ),
      accentBg:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white",
      isLive: false,
      badge: "Phase 5 Preview",
      badgeVariant: "default" as const,
      previewDetails: {
        title: "Scribbles & Instant Scratchpad",
        icon: <FileEdit className="w-6 h-6 text-purple-500" />,
        badge: "Roadmap: Phase 5",
        tagline:
          "A friction-free home for transient, chaotic thoughts with agentic AI writing tools.",
        roadmapPhase: "Phase 5",
        highlights: [
          "Zero-friction scratchpad accessible anywhere via keyboard shortcut.",
          "✨ Tidy & Structure: Formats stream-of-consciousness into clean markdown with headers & bullet points.",
          "🔍 Code-Editor Style Diff / Review Mode: Visual green/red diffs showing exact AI suggestions before accepting.",
          "🎯 'Untangle This' 1-Click Transformation: Extracts tasks into project lists or archives personal reflections into your journal.",
        ],
      },
    },
    {
      id: "journal",
      title: "Mindful Journal",
      tagline: "Daily reflections, mood check-ins, and weekly clarity reviews.",
      icon: <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      accentBg:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white",
      isLive: false,
      badge: "Phase 6 Preview",
      badgeVariant: "default" as const,
      previewDetails: {
        title: "Mindful Journal & Personal Reflections",
        icon: <BookOpen className="w-6 h-6 text-rose-500" />,
        badge: "Roadmap: Phase 6",
        tagline:
          "A calm, warm sanctuary to process thoughts, log moods, and reflect on life.",
        roadmapPhase: "Phase 6",
        highlights: [
          "Warm, distraction-free writing canvas with gentle daily prompts.",
          "Mood & energy tracker to correlate headspace with productivity.",
          "Calendar reflection streaks & chronological history browser.",
          "Weekly / Monthly AI Reviews: Gentle summaries of accomplishments, recurring themes, and mental clarity.",
        ],
      },
    },
  ];

  const handleScrollToLists = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("task-lists");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Workspace Feature Spaces
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">Untangle Modules</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {modules.map((m) => {
          if (m.isLive) {
            const isAnchor = m.href?.startsWith("#");
            const CardWrapper = ({
              children,
            }: {
              children: React.ReactNode;
            }) =>
              isAnchor ? (
                <a
                  href={m.href}
                  onClick={handleScrollToLists}
                  className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 text-left"
                >
                  {children}
                </a>
              ) : (
                <Link
                  href={m.href!}
                  className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 text-left"
                >
                  {children}
                </Link>
              );

            return (
              <CardWrapper key={m.id}>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${m.accentBg}`}
                  >
                    {m.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-foreground-muted bg-background-subtle px-2 py-0.5 rounded-full border border-border/60">
                      {m.badge}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                    {m.tagline}
                  </p>
                </div>
              </CardWrapper>
            );
          }

          // Preview / Upcoming modules
          return (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                m.previewDetails && setActivePreview(m.previewDetails)
              }
              className="group p-4 rounded-2xl bg-card/60 border border-dashed border-border hover:border-foreground-muted/40 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-3 text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${m.accentBg}`}
                >
                  {m.icon}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-foreground-muted/80 bg-background-subtle/80 px-2 py-0.5 rounded-full border border-border/50">
                    {m.badge}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-foreground">
                    {m.title}
                  </h3>
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                  {m.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature Preview Modal */}
      {isClient &&
        activePreview &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs overflow-hidden ${
              isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={handleClosePreview}
          >
            <div
              className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-card border-t sm:border border-border shadow-2xl p-5 sm:p-6 pb-8 sm:pb-6 relative flex flex-col gap-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto ${
                isClosing
                  ? "animate-slide-down sm:animate-fade-out"
                  : "animate-slide-up sm:animate-fade-in"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-foreground-muted/30 rounded-full mx-auto sm:hidden shrink-0 -mt-1 mb-0.5" />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background-subtle flex items-center justify-center border border-border">
                    {activePreview.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {activePreview.title}
                    </h3>
                    <span className="inline-block text-[11px] font-semibold text-primary">
                      {activePreview.badge}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="text-foreground-muted hover:text-foreground p-1 rounded-lg hover:bg-background-subtle transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-foreground-muted leading-relaxed">
                {activePreview.tagline}
              </p>

              <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
                <span className="text-xs font-semibold text-foreground">
                  Planned Capabilities:
                </span>
                <ul className="flex flex-col gap-2">
                  {activePreview.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-xs text-foreground-muted flex items-start gap-2"
                    >
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="text-xs px-4 py-1.5 rounded-lg bg-background-subtle hover:bg-border-muted text-foreground font-medium border border-border transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
