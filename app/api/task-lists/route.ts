import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/lib/services/task-service";
import { getCurrentUser } from "@/lib/auth/get-user";
import { z } from "zod";

const createListSchema = z.object({
  title: z.string().min(1, "Title is required"),
  rawInput: z.string().optional(),
  summary: z.string().optional(),
  tasks: z.array(
    z.object({
      title: z.string().min(1, "Task title is required"),
      description: z.string().nullable().optional(),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      dueDate: z.string().nullable().optional(),
    })
  ),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    const lists = await taskService.getUserTaskLists(user.id);
    return NextResponse.json(lists);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch task lists";
    console.error("Error in GET /api/task-lists:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = createListSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid task list payload", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const created = await taskService.createTaskListWithTasks(user.id, validated.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task list";
    console.error("Error in POST /api/task-lists:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
