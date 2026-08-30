import OpenAI from "openai";
import { TaskBreakdownResult } from "./schemas";

export function getDeepSeekClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}

/**
 * Intelligent local breakdown engine when no DEEPSEEK_API_KEY is configured.
 * Implements contextual time inference (breakfast, lunch, dinner, meetings) and null for vague tasks.
 */
export function generateLocalBreakdown(input: string): TaskBreakdownResult {
  const cleanInput = input.trim();
  const sentences = cleanInput
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Extract a sensible title
  const firstLine = sentences[0] || "Untangled Tasks";
  const title =
    firstLine.length > 50
      ? firstLine.slice(0, 47) + "..."
      : firstLine.replace(/^[-*•\d.]+\s*/, "").replace(/[.:]$/, "") || "Untangled Tasks";

  const motivationalTips = [
    "Focus on getting started—action creates momentum.",
    "Break this down into 15-minute focused sprints.",
    "Quick win: tackle the initial micro-step first.",
    "Review requirements and verify when finished.",
    "Take it step-by-step; small progress builds big results.",
  ];

  const parsedTasks = sentences.map((sentence, idx) => {
    const lower = sentence.toLowerCase();

    // Priority Inference
    let priority: "low" | "medium" | "high" = "medium";
    if (
      lower.includes("urgent") ||
      lower.includes("asap") ||
      lower.includes("critical") ||
      lower.includes("important") ||
      lower.includes("must")
    ) {
      priority = "high";
    } else if (
      lower.includes("maybe") ||
      lower.includes("later") ||
      lower.includes("someday") ||
      lower.includes("low priority") ||
      lower.includes("optional")
    ) {
      priority = "low";
    }

    // Smart Date & Time Inference
    let dueDate: string | null = null;
    const now = new Date();
    let targetDate: Date | null = null;

    if (lower.includes("tomorrow")) {
      targetDate = new Date(now);
      targetDate.setDate(now.getDate() + 1);
    } else if (lower.includes("today") || lower.includes("tonight")) {
      targetDate = new Date(now);
    } else if (lower.includes("next week")) {
      targetDate = new Date(now);
      targetDate.setDate(now.getDate() + 7);
    } else if (lower.includes("friday")) {
      targetDate = new Date(now);
      const day = targetDate.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + diff);
    }

    // If a date was found, infer appropriate contextual time
    if (targetDate) {
      if (lower.includes("breakfast") || lower.includes("morning routine")) {
        targetDate.setHours(8, 0, 0, 0);
      } else if (lower.includes("standup") || lower.includes("morning meeting") || lower.includes("morning")) {
        targetDate.setHours(9, 30, 0, 0);
      } else if (lower.includes("lunch") || lower.includes("noon")) {
        targetDate.setHours(12, 30, 0, 0);
      } else if (lower.includes("afternoon") || lower.includes("errand")) {
        targetDate.setHours(15, 0, 0, 0);
      } else if (lower.includes("gym") || lower.includes("workout") || lower.includes("after work")) {
        targetDate.setHours(18, 0, 0, 0);
      } else if (lower.includes("dinner") || lower.includes("evening") || lower.includes("tonight")) {
        targetDate.setHours(19, 30, 0, 0);
      } else if (lower.includes("bed") || lower.includes("night")) {
        targetDate.setHours(21, 30, 0, 0);
      } else {
        // Standard daytime default
        targetDate.setHours(9, 0, 0, 0);
      }

      dueDate = targetDate.toISOString();
    }

    // Clean up task title
    let taskTitle = sentence
      .replace(/^[-*•\d.]+\s*/, "")
      .replace(/^(i need to|i have to|we must|please|remember to|don't forget to|should)\s+/i, "");

    taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

    const tip = motivationalTips[idx % motivationalTips.length];
    const description =
      sentence.length > 50
        ? `From notes: "${sentence.trim()}". ${tip}`
        : `${tip}`;

    return {
      title: taskTitle.length > 80 ? taskTitle.slice(0, 77) + "..." : taskTitle,
      description,
      priority,
      dueDate,
    };
  });

  const tasks =
    parsedTasks.length > 0
      ? parsedTasks
      : [
          {
            title: "Review and clarify brain dump notes",
            description: `Original brain dump: "${input}". Review key goals and prioritize actions.`,
            priority: "medium" as const,
            dueDate: null,
          },
        ];

  return {
    title,
    summary: `Structured breakdown of your notes into ${tasks.length} actionable items with context and tips.`,
    tasks,
  };
}
