import { getDeepSeekClient } from "./deepseek";
import { taskBreakdownSchema, TaskBreakdownResult } from "./schemas";
import { generateLocalBreakdown } from "./deepseek";

/**
 * Generates an accurate, deterministic calendar lookup reference table for the next 14 days.
 * This supplies the LLM with exact ground-truth calendar dates so it never has to perform mental date math.
 */
export function getCalendarReferenceTable(): string {
  const now = new Date();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const lines: string[] = [];
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dayName = daysOfWeek[now.getDay()];
  const monthName = months[now.getMonth()];

  lines.push(`Current Anchor Date: ${yyyy}-${mm}-${dd} (${dayName}, ${monthName} ${now.getDate()}, ${yyyy})`);
  lines.push(`- TODAY / HARI INI: ${yyyy}-${mm}-${dd}`);

  for (let i = 1; i <= 14; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const fYyyy = futureDate.getFullYear();
    const fMm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const fDd = String(futureDate.getDate()).padStart(2, "0");
    const fDayName = daysOfWeek[futureDate.getDay()];
    const fMonthName = months[futureDate.getMonth()];

    let label = `+${i} day(s)`;
    if (i === 1) label = "TOMORROW / BESOK";
    else if (i === 2) label = "DAY AFTER TOMORROW / LUSA";

    lines.push(`- ${label} (${fDayName}, ${fMonthName} ${futureDate.getDate()}): ${fYyyy}-${fMm}-${fDd}`);
  }

  return lines.join("\n");
}

function getLanguageInstruction(language: string): string {
  switch (language) {
    case "id":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in fluent BAHASA INDONESIA.";
    case "en":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in clear ENGLISH.";
    case "es":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in fluent SPANISH (Español).";
    case "ja":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in natural JAPANESE (日本語).";
    case "fr":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in fluent FRENCH (Français).";
    case "de":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in fluent GERMAN (Deutsch).";
    case "zh":
      return "CRITICAL: You MUST write all titles, descriptions, context notes, and summaries in natural CHINESE (中文).";
    case "auto":
    default:
      return "CRITICAL: Detect the language of the user input and write the entire response in that EXACT SAME LANGUAGE.";
  }
}

/**
 * Validates task due dates without overriding specific times extracted by AI.
 */
export function sanitizeAndValidateTaskDates(
  _rawInput: string,
  result: TaskBreakdownResult
): TaskBreakdownResult {
  const processedTasks = result.tasks.map((task) => {
    let finalDueDate = task.dueDate;

    if (finalDueDate) {
      const parsed = new Date(finalDueDate);
      if (isNaN(parsed.getTime())) {
        finalDueDate = null;
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
    console.warn("DeepSeek API key missing, using built-in heuristic breakdown");
    const fallback = generateLocalBreakdown(input);
    return sanitizeAndValidateTaskDates(input, fallback);
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
1. Relative dates (e.g. "tomorrow", "besok", "this Friday", "next week", "tonight"):
   - ALWAYS look up the exact date string from the CALENDAR REFERENCE table above.
   - For example, if the user says "tomorrow" or "besok", find "TOMORROW" in the table and use that exact YYYY-MM-DD date.
2. Explicit times (CRITICAL):
   - If a specific hour/time is mentioned (e.g. "5 AM" -> 05:00:00, "jam 8" -> 08:00:00, "jam 5 sore" / "5 PM" -> 17:00:00, "setengah 7 malam" -> 18:30:00, "setengah 10 malam" -> 21:30:00, "jam 10 malam" -> 22:00:00), use that exact hour and minute in 24-hour ISO format (YYYY-MM-DDTHH:mm:ss).
3. Contextual time of day (if no explicit hour is given):
   - "Breakfast" / "morning coffee" / "sarapan": set time to 08:00:00.
   - "Morning meeting" / "standup" / "start work": set time to 09:30:00.
   - "Lunch" / "makan siang": set time to 12:30:00.
   - "Afternoon sync" / "errands" / "tea": set time to 15:00:00.
   - "End of workday" / "pulang kantor": set time to 17:00:00.
   - "Gym" / "workout" / "jogging": set time to 18:00:00 (or relative to adjacent tasks).
   - "Dinner" / "makan malam": set time to 19:30:00.
   - "Night" / "before bed" / "tidur": set time to 22:00:00.
   - If a date is mentioned without a specific time, default to 09:00:00.
4. CRITICAL RULE FOR VAGUE / UNDATED TASKS:
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
