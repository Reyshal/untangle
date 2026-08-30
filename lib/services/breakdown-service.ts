import { breakdownText } from "../ai/breakdown";
import { TaskBreakdownResult } from "../ai/schemas";

export class BreakdownService {
  async processBrainDump(text: string, language: string = "auto"): Promise<TaskBreakdownResult> {
    if (!text || text.trim().length < 3) {
      throw new Error("Input text is too short to untangle.");
    }
    return await breakdownText(text, language);
  }
}

export const breakdownService = new BreakdownService();
