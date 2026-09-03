import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/lib/services/task-service";
import { getCurrentUser } from "@/lib/auth/get-user";
import { z } from "zod";

const createTaskSchema = z.object({
  taskListId: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    const tasks = await taskService.getAllUserTasks(user.id);
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tasks";
    console.error("Error in GET /api/tasks:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = createTaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid task payload", details: validated.error.flatten() },
        { status: 400 },
      );
    }

    const newTask = await taskService.createTask(user.id, validated.data);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create task";
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
