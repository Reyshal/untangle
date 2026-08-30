import { breakdownText } from "../ai/breakdown";
import { TaskBreakdownResult } from "../ai/schemas";

export class BreakdownService {
  async processBrainDump(
    text: string,
    language: string = "auto",
    autoSchedule: boolean = true,
    clientDate?: string
  ): Promise<TaskBreakdownResult> {
    if (!text || text.trim().length < 3) {
      throw new Error("Input text is too short to untangle.");
    }
    return await breakdownText(text, language, autoSchedule, clientDate);
  }
}

export const breakdownService = new BreakdownService();
