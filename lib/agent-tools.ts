import { tool } from "ai";
import { z } from "zod";
import {
  addTodoForUser,
  clearCompletedForUser,
  deleteTodoForUser,
  editTodoForUser,
  listTodosForUser,
  toggleTodoForUser,
  updateTodoMetaForUser,
} from "@/lib/todo-db";
import type { Recurrence } from "@/lib/types";

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .describe("Deadline as YYYY-MM-DD");

const recurrenceSchema = z
  .enum(["none", "daily", "weekly", "monthly"])
  .describe("How often the task repeats");

/** Server-side todo tools. The OpenAI key never leaves this process. */
export function createAgentTools(userId: string) {
  return {
    list_todos: tool({
      description:
        "List all current todos with id, text, completed, dueDate, and recurrence.",
      inputSchema: z.object({}),
      execute: async () => ({ todos: await listTodosForUser(userId) }),
    }),
    add_todo: tool({
      description:
        "Add a new incomplete todo to the top of the list. Optional deadline and recurrence.",
      inputSchema: z.object({
        text: z.string().min(1).describe("The task text to add"),
        dueDate: dueDateSchema.optional().describe("Optional deadline YYYY-MM-DD"),
        recurrence: recurrenceSchema
          .optional()
          .describe("Optional recurrence; defaults to none"),
      }),
      execute: async ({ text, dueDate, recurrence }) =>
        addTodoForUser(userId, text, { dueDate, recurrence }),
    }),
    toggle_todo: tool({
      description:
        "Toggle a todo's completed status by id. Recurring tasks (recurrence not none) roll the deadline forward and stay incomplete instead of staying completed.",
      inputSchema: z.object({
        id: z.string().describe("The todo id"),
      }),
      execute: async ({ id }) => toggleTodoForUser(userId, id),
    }),
    edit_todo: tool({
      description: "Change the text of an existing todo by id.",
      inputSchema: z.object({
        id: z.string().describe("The todo id"),
        text: z.string().min(1).describe("The new task text"),
      }),
      execute: async ({ id, text }) => editTodoForUser(userId, id, text),
    }),
    update_todo_meta: tool({
      description:
        "Update a todo's deadline and/or recurrence by id. Recurring tasks without a deadline get today's date.",
      inputSchema: z.object({
        id: z.string().describe("The todo id"),
        dueDate: dueDateSchema
          .nullable()
          .optional()
          .describe("Deadline YYYY-MM-DD, or null to clear"),
        recurrence: recurrenceSchema.optional(),
      }),
      execute: async ({ id, dueDate, recurrence }) => {
        const meta: {
          dueDate?: string | null;
          recurrence?: Recurrence;
        } = {};
        if (dueDate !== undefined) meta.dueDate = dueDate;
        if (recurrence !== undefined) meta.recurrence = recurrence;
        if (meta.dueDate === undefined && meta.recurrence === undefined) {
          return { error: "Provide dueDate and/or recurrence" };
        }
        return updateTodoMetaForUser(userId, id, meta);
      },
    }),
    delete_todo: tool({
      description: "Delete a todo by id.",
      inputSchema: z.object({
        id: z.string().describe("The todo id"),
      }),
      execute: async ({ id }) => deleteTodoForUser(userId, id),
    }),
    clear_completed: tool({
      description: "Remove all completed todos from the list.",
      inputSchema: z.object({}),
      execute: async () => clearCompletedForUser(userId),
    }),
  };
}
