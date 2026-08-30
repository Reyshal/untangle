import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/lib/services/task-service";
import { getCurrentUser } from "@/lib/auth/get-user";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().nullable().optional(),
  isDone: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = updateTaskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid task update payload", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await taskService.updateTask(id, user.id, validated.data);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task";
    console.error("Error in PATCH /api/tasks/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const success = await taskService.deleteTask(id, user.id);

    return NextResponse.json({ success });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task";
    console.error("Error in DELETE /api/tasks/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
