import { getDeepSeekClient, generateLocalBreakdown } from "./deepseek";
import { taskBreakdownSchema, TaskBreakdownResult } from "./schemas";

function getLanguageInstruction(language: string): string {
  switch (language.toLowerCase()) {
    case "id":
    case "indonesian":
    case "bahasa indonesia":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in Indonesian (Bahasa Indonesia).";
    case "en":
    case "english":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in English.";
    case "es":
    case "spanish":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in Spanish (Español).";
    case "ja":
    case "japanese":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in Japanese (日本語).";
    case "fr":
    case "french":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in French (Français).";
    case "de":
    case "german":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in German (Deutsch).";
    case "zh":
    case "chinese":
      return "LANGUAGE REQUIREMENT: You MUST write the entire JSON response (title, summary, task titles, and description notes) in Simplified Chinese (简体中文).";
    default:
      return "LANGUAGE REQUIREMENT: Write the entire JSON response (title, summary, task titles, and description notes) in the EXACT same language as the input text.";
  }
}

/**
 * Builds an exact, verified 14-day calendar lookup table so the AI
 * does not have to perform mental date arithmetic or guess days of the month.
 */
function getCalendarReferenceTable(): string {
  const now = new Date();
  const formatIsoDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const scheduleMap: string[] = [];
  scheduleMap.push(`- TODAY: ${formatIsoDate(now)} (${now.toLocaleDateString("en-US", { weekday: "long" })})`);

  for (let i = 1; i <= 14; i++) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    const dayName = next.toLocaleDateString("en-US", { weekday: "long" });
    const label =
      i === 1
        ? "TOMORROW"
        : i === 2
        ? "DAY AFTER TOMORROW"
        : i === 7
        ? "NEXT WEEK (SAME DAY NEXT WEEK)"
        : `${dayName.toUpperCase()} (+${i} DAYS)`;
    scheduleMap.push(`- ${label}: ${formatIsoDate(next)}`);
  }

  return scheduleMap.join("\n");
}

/**
 * Programmatic Date Validation & Normalizer.
 * Verifies and enforces exact date correctness on the backend regardless of LLM calculation quirks.
 */
export function sanitizeAndValidateTaskDates(
  rawInput: string,
  result: TaskBreakdownResult
): TaskBreakdownResult {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const getExactDateOffset = (offsetDays: number) => {
    const d = new Date(currentYear, currentMonth, currentDate + offsetDays);
    return d;
  };

  const formatWithTime = (dateObj: Date, originalDueDateStr: string | null | undefined, defaultHour = 9, defaultMinute = 0) => {
    let hours = defaultHour;
    let minutes = defaultMinute;
    let seconds = 0;

    if (originalDueDateStr && originalDueDateStr.includes("T")) {
      const timePart = originalDueDateStr.split("T")[1];
      const parts = timePart.split(":").map(Number);
      if (!isNaN(parts[0])) hours = parts[0];
      if (!isNaN(parts[1])) minutes = parts[1];
      if (!isNaN(parts[2])) seconds = parts[2];
    }

    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const hh = String(hours).padStart(2, "0");
    const min = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  };

  const processedTasks = result.tasks.map((task) => {
    const taskText = `${task.title} ${task.description || ""}`.toLowerCase();
    const rawLower = rawInput.toLowerCase();
    let finalDueDate = task.dueDate;

    const mentionsTomorrow =
      taskText.includes("tomorrow") ||
      taskText.includes("besok") ||
      taskText.includes("esok");

    const mentionsLusa =
      taskText.includes("day after tomorrow") ||
      taskText.includes("lusa");

    const mentionsToday =
      taskText.includes("today") ||
      taskText.includes("hari ini") ||
      taskText.includes("tonight") ||
      taskText.includes("malam ini");

    if (mentionsTomorrow || (task.dueDate && rawLower.includes("tomorrow")) || (task.dueDate && rawLower.includes("besok"))) {
      const tomorrow = getExactDateOffset(1);
      finalDueDate = formatWithTime(tomorrow, task.dueDate, 9, 0);
    } else if (mentionsLusa) {
      const lusa = getExactDateOffset(2);
      finalDueDate = formatWithTime(lusa, task.dueDate, 9, 0);
    } else if (mentionsToday) {
      const today = getExactDateOffset(0);
      const isNight = taskText.includes("night") || taskText.includes("malam") || taskText.includes("tonight");
      finalDueDate = formatWithTime(today, task.dueDate, isNight ? 19 : 9, 0);
    } else if (finalDueDate) {
      // Validate date bounds (ensure year is current/future and valid date)
      const parsed = new Date(finalDueDate);
      if (!isNaN(parsed.getTime())) {
        if (parsed.getFullYear() < currentYear) {
          parsed.setFullYear(currentYear);
          finalDueDate = formatWithTime(parsed, finalDueDate);
        }
      }
    }

    return {
      ...task,
      dueDate: finalDueDate,
    };
  });

  return {
    ...result,
    tasks: processedTasks,
  };
}

export async function breakdownText(input: string, language: string = "auto"): Promise<TaskBreakdownResult> {
  const client = getDeepSeekClient();

  // If no DeepSeek API key is configured, use the built-in heuristic breakdown
  if (!client) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const local = generateLocalBreakdown(input);
    return sanitizeAndValidateTaskDates(input, local);
  }

  const langInstruction = getLanguageInstruction(language);
  const calendarTable = getCalendarReferenceTable();

  const systemPrompt = `You are Untangle, an intelligent executive planner and task decomposition engine.
Your mission is to take an unstructured brain dump, stream-of-consciousness text, daily routine, or project notes, and organize them into clear, actionable tasks with smart contextual date/time scheduling and helpful notes.

${langInstruction}

EXACT VERIFIED CALENDAR REFERENCE (USE THESE DATES DIRECTLY - DO NOT GUESS OR CALCULATE DATES MANUALLY):
${calendarTable}

You MUST respond strictly with a valid JSON object adhering to this exact schema:
{
  "title": "A concise, descriptive name for this list/schedule (max 8 words)",
  "summary": "A 1-sentence executive summary of the intent",
  "tasks": [
    {
      "title": "Clear, actionable task starting with an imperative verb",
      "description": "A helpful note containing context from the user notes, recommended next step, actionable tip, or brief motivational nudge (1-2 sentences)",
      "priority": "low" | "medium" | "high",
      "dueDate": "ISO 8601 string 'YYYY-MM-DDTHH:mm:ss' if date/time is specified or contextually inferred, or null"
    }
  ]
}

SMART DATE & TIME SCHEDULING RULES:
1. Relative dates (e.g. "tomorrow", "this Friday", "next week", "tonight"):
   - ALWAYS look up the exact date string from the CALENDAR REFERENCE table above.
   - For example, if the user says "tomorrow", find "TOMORROW" in the table and use that exact YYYY-MM-DD date.
2. Contextual time of day:
   - "Breakfast" / "morning coffee" / "morning walk": set time to 08:00:00.
   - "Morning meeting" / "standup" / "deep work" / "start work": set time to 09:30:00.
   - "Lunch" / "midday": set time to 12:30:00.
   - "Afternoon sync" / "errands" / "tea": set time to 15:00:00.
   - "End of workday" / "wrap up": set time to 17:00:00.
   - "Gym" / "workout" / "after work": set time to 18:00:00.
   - "Dinner" / "evening": set time to 19:30:00.
   - "Night" / "before bed" / "reading": set time to 21:30:00.
   - If a date is mentioned without a specific time, default to 09:00:00.
3. CRITICAL RULE FOR VAGUE / UNDATED TASKS:
   - If a task has NO deadline, date, or timeframe mentioned (e.g. "I want to complete this project someday", "learn TypeScript", "reorganize bookshelf"), you MUST set "dueDate": null. Do NOT make up arbitrary dates.

Rules for tasks and notes:
1. Break down thoughts into discrete single-step tasks.
2. For EVERY task, provide a valuable "description" note with details and helpful micro-tips.
3. Infer priority based on urgency words (urgent, ASAP, blocker, critical -> high; maybe, someday, optional -> low; standard -> medium).
4. Do NOT include markdown code fences or conversational text. Output raw valid JSON only.`;

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please untangle and schedule this text:\n\n${input}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response received from DeepSeek AI");
    }

    const parsedJson = JSON.parse(content);
    const validated = taskBreakdownSchema.safeParse(parsedJson);

    if (validated.success) {
      return sanitizeAndValidateTaskDates(input, validated.data);
    }

    console.warn("Validation failed on AI response, retrying with strict fallback:", validated.error);

    // Attempt 1 retry with corrective reminder
    const retryResponse = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Input:\n${input}\n\nYour previous JSON had formatting errors. Fix it and output ONLY valid JSON matching the schema. Remember to use the exact dates from the CALENDAR REFERENCE table (null for vague items, ISO timestamp for scheduled items).`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const retryContent = retryResponse.choices[0]?.message?.content;
    if (retryContent) {
      const retryParsed = JSON.parse(retryContent);
      const retryValidated = taskBreakdownSchema.safeParse(retryParsed);
      if (retryValidated.success) {
        return sanitizeAndValidateTaskDates(input, retryValidated.data);
      }
    }

    const fallback = generateLocalBreakdown(input);
    return sanitizeAndValidateTaskDates(input, fallback);
  } catch (error) {
    console.error("DeepSeek breakdown error, falling back to local heuristic breakdown:", error);
    const fallback = generateLocalBreakdown(input);
    return sanitizeAndValidateTaskDates(input, fallback);
  }
}
