import { db, isDbMock, taskLists, tasks, TaskList, NewTaskList } from "../db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// In-memory store for local testing / offline development
export const inMemoryTaskLists: TaskList[] = [];
export const inMemoryTasks: (typeof tasks.$inferSelect)[] = [];

export class TaskListRepository {
  async create(data: {
    userId: string;
    title: string;
    rawInput?: string;
    summary?: string;
  }): Promise<TaskList> {
    const id = crypto.randomUUID();
    const now = new Date();

    const record: TaskList = {
      id,
      userId: data.userId,
      title: data.title,
      rawInput: data.rawInput || null,
      summary: data.summary || null,
      createdAt: now,
      updatedAt: now,
    };

    if (!isDbMock() && db) {
      try {
        const [newList] = await db.insert(taskLists).values(record).returning();
        if (newList) return newList;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database unavailable, falling back to local memory store:", msg);
      }
    }

    inMemoryTaskLists.unshift(record);
    return record;
  }

  async findByUserId(userId: string): Promise<(TaskList & { taskCount: number; completedCount: number })[]> {
    if (!isDbMock() && db) {
      try {
        const lists = await db
          .select()
          .from(taskLists)
          .where(eq(taskLists.userId, userId))
          .orderBy(desc(taskLists.createdAt));

        const results = await Promise.all(
          lists.map(async (list: TaskList) => {
            const listTasks = await db
              .select()
              .from(tasks)
              .where(eq(tasks.taskListId, list.id));

            return {
              ...list,
              taskCount: listTasks.length,
              completedCount: listTasks.filter((t: typeof tasks.$inferSelect) => t.isDone).length,
            };
          })
        );
        if (results.length > 0) return results;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database query error, using local memory store:", msg);
      }
    }

    const filtered = inMemoryTaskLists.filter((l) => l.userId === userId || userId === "demo-user-id");
    return filtered.map((l) => {
      const listTasks = inMemoryTasks.filter((t) => t.taskListId === l.id);
      return {
        ...l,
        taskCount: listTasks.length,
        completedCount: listTasks.filter((t) => t.isDone).length,
      };
    });
  }

  async findById(id: string, userId: string): Promise<(TaskList & { tasks: (typeof tasks.$inferSelect)[] }) | null> {
    if (!isDbMock() && db) {
      try {
        const [list] = await db
          .select()
          .from(taskLists)
          .where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)));

        if (list) {
          const listTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.taskListId, id))
            .orderBy(tasks.sortOrder, desc(tasks.createdAt));

          return {
            ...list,
            tasks: listTasks,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database find error, using local memory store:", msg);
      }
    }

    const list = inMemoryTaskLists.find((l) => l.id === id);
    if (!list) return null;

    const listTasks = inMemoryTasks
      .filter((t) => t.taskListId === id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      ...list,
      tasks: listTasks,
    };
  }

  async update(id: string, userId: string, data: Partial<NewTaskList>): Promise<TaskList | null> {
    if (!isDbMock() && db) {
      try {
        const [updated] = await db
          .update(taskLists)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)))
          .returning();

        if (updated) return updated;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database update error, using local memory store:", msg);
      }
    }

    const index = inMemoryTaskLists.findIndex((l) => l.id === id);
    if (index === -1) return null;

    inMemoryTaskLists[index] = {
      ...inMemoryTaskLists[index],
      ...data,
      updatedAt: new Date(),
    };
    return inMemoryTaskLists[index];
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (!isDbMock() && db) {
      try {
        const result = await db
          .delete(taskLists)
          .where(and(eq(taskLists.id, id), eq(taskLists.userId, userId)))
          .returning();

        if (result.length > 0) return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Database delete error, using local memory store:", msg);
      }
    }

    const index = inMemoryTaskLists.findIndex((l) => l.id === id);
    if (index !== -1) {
      inMemoryTaskLists.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const taskListRepository = new TaskListRepository();
