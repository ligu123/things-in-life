import { tool } from "ai";
import { z } from "zod";

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .describe("Deadline as YYYY-MM-DD");

const recurrenceSchema = z
  .enum(["none", "daily", "weekly", "monthly"])
  .describe("How often the task repeats");

/** Tool schemas for the todo agent (executed on the client). */
export const agentTools = {
  list_todos: tool({
    description:
      "List all current todos with id, text, completed, dueDate, and recurrence.",
    inputSchema: z.object({}),
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
  }),
  toggle_todo: tool({
    description:
      "Toggle a todo's completed status by id. Recurring tasks (recurrence not none) roll the deadline forward and stay incomplete instead of staying completed.",
    inputSchema: z.object({
      id: z.string().describe("The todo id"),
    }),
  }),
  edit_todo: tool({
    description: "Change the text of an existing todo by id.",
    inputSchema: z.object({
      id: z.string().describe("The todo id"),
      text: z.string().min(1).describe("The new task text"),
    }),
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
  }),
  delete_todo: tool({
    description: "Delete a todo by id.",
    inputSchema: z.object({
      id: z.string().describe("The todo id"),
    }),
  }),
  clear_completed: tool({
    description: "Remove all completed todos from the list.",
    inputSchema: z.object({}),
  }),
};
