import { z } from "zod";

export const taskDraftItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Task title cannot be empty"),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().nullable().optional(),
});

export const taskBreakdownSchema = z.object({
  title: z.string().min(1, "List title is required").default("Untangled Task List"),
  summary: z.string().optional().default(""),
  tasks: z.array(taskDraftItemSchema).min(1, "At least one task must be generated"),
});

export const breakdownRequestSchema = z.object({
  text: z.string().min(3, "Please enter at least a few words to breakdown").max(5000, "Brain dump text is too long"),
  language: z.string().optional().default("auto"),
});

export type TaskDraftItem = z.infer<typeof taskDraftItemSchema>;
export type TaskBreakdownResult = z.infer<typeof taskBreakdownSchema>;
export type BreakdownRequest = z.infer<typeof breakdownRequestSchema>;
