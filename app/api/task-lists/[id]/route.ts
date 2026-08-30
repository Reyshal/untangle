import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/lib/services/task-service";
import { getCurrentUser } from "@/lib/auth/get-user";
import { z } from "zod";

const updateListSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  summary: z.string().nullable().optional(),
  rawInput: z.string().nullable().optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1, "Task title cannot be empty"),
        description: z.string().nullable().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueDate: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const list = await taskService.getTaskListDetail(id, user.id);

    if (!list) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch task list";
    console.error("Error in GET /api/task-lists/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = updateListSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const updated = await taskService.regenerateTaskList(id, user.id, validated.data);
    if (!updated) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to regenerate task list";
    console.error("Error in PUT /api/task-lists/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const validated = updateListSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const updated = await taskService.regenerateTaskList(id, user.id, validated.data);
    if (!updated) {
      return NextResponse.json({ error: "Task list not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update task list";
    console.error("Error in PATCH /api/task-lists/[id]:", error);
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
    const deleted = await taskService.deleteTaskList(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete task list" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete task list";
    console.error("Error in DELETE /api/task-lists/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
