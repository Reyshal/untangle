import { db, isDbMock, tasks, taskLists, Task, NewTask } from "../db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import { inMemoryTasks, inMemoryTaskLists } from "./task-list-repository";

export type TaskWithList = Task & { listTitle?: string };

export class TaskRepository {
  async create(data: {
    taskListId: string;
    userId: string;
    title: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    dueDate?: Date | null;
    sortOrder?: number;
  }): Promise<Task> {
    const id = crypto.randomUUID();
    const now = new Date();

    const record: Task = {
      id,
      taskListId: data.taskListId,
      userId: data.userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      isDone: false,
      sortOrder: data.sortOrder || 0,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbMock() && db) {
      try {
        const [newTask] = await db.insert(tasks).values(record).returning();
        if (newTask) return newTask;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database create error, using local memory store:", msg);
      }
    }

    inMemoryTasks.push(record);
    return record;
  }

  async createMany(
    items: Array<{
      taskListId: string;
      userId: string;
      title: string;
      description?: string | null;
      priority?: "low" | "medium" | "high";
      dueDate?: Date | null;
      sortOrder?: number;
    }>
  ): Promise<Task[]> {
    if (items.length === 0) return [];

    const now = new Date();
    const values: Task[] = items.map((item, index) => ({
      id: crypto.randomUUID(),
      taskListId: item.taskListId,
      userId: item.userId,
      title: item.title,
      description: item.description || null,
      priority: item.priority || "medium",
      dueDate: item.dueDate || null,
      isDone: false,
      sortOrder: item.sortOrder ?? index,
      createdAt: now,
      updatedAt: now,
    }));

    if (!isDbMock() && db) {
      try {
        const result = await db.insert(tasks).values(values).returning();
        if (result && result.length > 0) return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database createMany error, using local memory store:", msg);
      }
    }

    inMemoryTasks.push(...values);
    return values;
  }

  async findByUserId(userId: string): Promise<TaskWithList[]> {
    if (!isDbMock() && db) {
      try {
        const result = await db
          .select({
            task: tasks,
            listTitle: taskLists.title,
          })
          .from(tasks)
          .leftJoin(taskLists, eq(tasks.taskListId, taskLists.id))
          .where(eq(tasks.userId, userId))
          .orderBy(desc(tasks.dueDate), desc(tasks.createdAt));

        if (result.length > 0) {
          return result.map((r) => ({
            ...r.task,
            listTitle: r.listTitle || undefined,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database findByUserId error, using local memory store:", msg);
      }
    }

    return inMemoryTasks
      .filter((t) => t.userId === userId || userId === "demo-user-id")
      .map((t) => {
        const list = inMemoryTaskLists.find((l) => l.id === t.taskListId);
        return { ...t, listTitle: list?.title };
      });
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    if (!isDbMock() && db) {
      try {
        const [task] = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
        if (task) return task;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database findById error, using local memory store:", msg);
      }
    }

    const t = inMemoryTasks.find((item) => item.id === id);
    return t || null;
  }

  async update(id: string, userId: string, data: Partial<NewTask>): Promise<Task | null> {
    if (!isDbMock() && db) {
      try {
        const [updated] = await db
          .update(tasks)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
          .returning();
        if (updated) return updated;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database update task error, using local memory store:", msg);
      }
    }

    const index = inMemoryTasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    inMemoryTasks[index] = {
      ...inMemoryTasks[index],
      ...data,
      updatedAt: new Date(),
    };
    return inMemoryTasks[index];
  }

  async toggleComplete(id: string, userId: string): Promise<Task | null> {
    const current = await this.findById(id, userId);
    if (!current) return null;

    return await this.update(id, userId, {
      isDone: !current.isDone,
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!isDbMock() && db) {
      try {
        const result = await db
          .delete(tasks)
          .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
          .returning();
        if (result.length > 0) return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database delete task error, using local memory store:", msg);
      }
    }

    const index = inMemoryTasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      inMemoryTasks.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const taskRepository = new TaskRepository();
