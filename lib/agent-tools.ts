import { tool } from "ai";
import { z } from "zod";

/** Tool schemas for the todo agent (executed on the client). */
export const agentTools = {
  list_todos: tool({
    description: "List all current todos with id, text, and completed status.",
    inputSchema: z.object({}),
  }),
  add_todo: tool({
    description: "Add a new incomplete todo to the top of the list.",
    inputSchema: z.object({
      text: z.string().min(1).describe("The task text to add"),
    }),
  }),
  toggle_todo: tool({
    description: "Toggle a todo's completed status by id.",
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
