import { taskListRepository } from "../repositories/task-list-repository";
import { taskRepository, TaskWithList } from "../repositories/task-repository";
import { NewTask } from "../db";

export interface CreateTaskListInput {
  title: string;
  rawInput?: string;
  summary?: string;
  tasks: Array<{
    title: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
  }>;
}

export class TaskService {
  async createTaskListWithTasks(userId: string, input: CreateTaskListInput) {
    const list = await taskListRepository.create({
      userId,
      title: input.title,
      rawInput: input.rawInput,
      summary: input.summary,
    });

    const taskItems = input.tasks.map((t, idx) => ({
      taskListId: list.id,
      userId,
      title: t.title,
      description: t.description || null,
      priority: t.priority || "medium",
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      sortOrder: idx,
    }));

    const createdTasks = await taskRepository.createMany(taskItems);

    return {
      ...list,
      tasks: createdTasks,
    };
  }

  async getUserTaskLists(userId: string) {
    return await taskListRepository.findByUserId(userId);
  }

  async getTaskListDetail(taskListId: string, userId: string) {
    return await taskListRepository.findById(taskListId, userId);
  }

  async updateTaskList(
    taskListId: string,
    userId: string,
    data: { title?: string; summary?: string | null; rawInput?: string | null }
  ) {
    return await taskListRepository.update(taskListId, userId, data);
  }

  async regenerateTaskList(
    taskListId: string,
    userId: string,
    data: {
      title?: string;
      summary?: string | null;
      rawInput?: string | null;
      tasks?: Array<{
        title: string;
        description?: string | null;
        priority?: "low" | "medium" | "high";
        dueDate?: string | null;
      }>;
    }
  ) {
    const updatedList = await taskListRepository.update(taskListId, userId, {
      ...(data.title ? { title: data.title } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.rawInput !== undefined ? { rawInput: data.rawInput } : {}),
    });

    if (!updatedList) return null;

    if (data.tasks) {
      await taskRepository.deleteByTaskListId(taskListId, userId);

      const taskItems = data.tasks.map((t, idx) => ({
        taskListId,
        userId,
        title: t.title,
        description: t.description || null,
        priority: t.priority || "medium",
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        sortOrder: idx,
      }));

      const createdTasks = await taskRepository.createMany(taskItems);

      return {
        ...updatedList,
        tasks: createdTasks,
      };
    }

    return await taskListRepository.findById(taskListId, userId);
  }

  async deleteTaskList(taskListId: string, userId: string) {
    return await taskListRepository.delete(taskListId, userId);
  }

  async getAllUserTasks(userId: string): Promise<TaskWithList[]> {
    return await taskRepository.findByUserId(userId);
  }

  async createTask(
    userId: string,
    data: {
      taskListId: string;
      title: string;
      description?: string | null;
      priority?: "low" | "medium" | "high";
      dueDate?: string | null;
    }
  ) {
    return await taskRepository.create({
      taskListId: data.taskListId,
      userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });
  }

  async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: "low" | "medium" | "high";
      dueDate?: string | null;
      isDone?: boolean;
    }
  ) {
    const updatePayload: Partial<NewTask> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.isDone !== undefined) updatePayload.isDone = data.isDone;
    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    return await taskRepository.update(taskId, userId, updatePayload);
  }

  async toggleTask(taskId: string, userId: string) {
    return await taskRepository.toggleComplete(taskId, userId);
  }

  async deleteTask(taskId: string, userId: string) {
    return await taskRepository.delete(taskId, userId);
  }
}

export const taskService = new TaskService();
