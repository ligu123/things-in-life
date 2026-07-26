import {
  isDueDateString,
  isRecurrence,
} from "@/lib/recurrence";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  editTodo,
  listTodos,
  toggleTodo,
  updateTodoMeta,
} from "@/lib/todo-actions";
import type { Recurrence } from "@/lib/types";

type ToolInput = Record<string, unknown>;

export function runAgentTool(
  toolName: string,
  input: ToolInput,
): unknown {
  switch (toolName) {
    case "list_todos":
      return { todos: listTodos() };

    case "add_todo": {
      const text = String(input.text ?? "").trim();
      if (!text) return { error: "Text is required" };

      const dueDateRaw = input.dueDate;
      const recurrenceRaw = input.recurrence;

      let dueDate: string | null | undefined;
      if (dueDateRaw === undefined) {
        dueDate = undefined;
      } else if (dueDateRaw === null || dueDateRaw === "") {
        dueDate = null;
      } else if (isDueDateString(dueDateRaw)) {
        dueDate = dueDateRaw;
      } else {
        return { error: "dueDate must be YYYY-MM-DD" };
      }

      let recurrence: Recurrence | undefined;
      if (recurrenceRaw === undefined) {
        recurrence = undefined;
      } else if (isRecurrence(recurrenceRaw)) {
        recurrence = recurrenceRaw;
      } else {
        return { error: "Invalid recurrence" };
      }

      return { todo: addTodo(text, { dueDate, recurrence }) };
    }

    case "toggle_todo": {
      const id = String(input.id ?? "");
      const todo = toggleTodo(id);
      return todo
        ? { todo }
        : { error: `Todo not found: ${id}` };
    }

    case "edit_todo": {
      const id = String(input.id ?? "");
      const text = String(input.text ?? "").trim();
      const todo = editTodo(id, text);
      return todo
        ? { todo }
        : { error: `Could not edit todo: ${id}` };
    }

    case "update_todo_meta": {
      const id = String(input.id ?? "");
      if (!id) return { error: "Id is required" };

      const meta: {
        dueDate?: string | null;
        recurrence?: Recurrence;
      } = {};

      if ("dueDate" in input) {
        if (input.dueDate === null || input.dueDate === "") {
          meta.dueDate = null;
        } else if (isDueDateString(input.dueDate)) {
          meta.dueDate = input.dueDate;
        } else {
          return { error: "dueDate must be YYYY-MM-DD or null" };
        }
      }

      if ("recurrence" in input) {
        if (!isRecurrence(input.recurrence)) {
          return { error: "Invalid recurrence" };
        }
        meta.recurrence = input.recurrence;
      }

      if (meta.dueDate === undefined && meta.recurrence === undefined) {
        return { error: "Provide dueDate and/or recurrence" };
      }

      const todo = updateTodoMeta(id, meta);
      return todo
        ? { todo }
        : { error: `Could not update todo: ${id}` };
    }

    case "delete_todo": {
      const id = String(input.id ?? "");
      const ok = deleteTodo(id);
      return ok
        ? { deleted: id }
        : { error: `Todo not found: ${id}` };
    }

    case "clear_completed":
      return { removed: clearCompleted() };

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

export function toolSummary(toolName: string, output: unknown): string {
  if (!output || typeof output !== "object") return `${toolName} done`;

  const record = output as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;

  switch (toolName) {
    case "list_todos": {
      const todos = record.todos;
      const count = Array.isArray(todos) ? todos.length : 0;
      return `Listed ${count} task${count === 1 ? "" : "s"}`;
    }
    case "add_todo": {
      const todo = record.todo as { text?: string } | undefined;
      return todo?.text ? `Added “${todo.text}”` : "Added task";
    }
    case "toggle_todo": {
      const todo = record.todo as {
        text?: string;
        completed?: boolean;
        recurrence?: string;
        dueDate?: string | null;
      } | undefined;
      if (!todo?.text) return "Toggled task";
      if (todo.recurrence && todo.recurrence !== "none") {
        return todo.dueDate
          ? `Rolled “${todo.text}” to ${todo.dueDate}`
          : `Rolled “${todo.text}” forward`;
      }
      return todo.completed
        ? `Completed “${todo.text}”`
        : `Reopened “${todo.text}”`;
    }
    case "edit_todo": {
      const todo = record.todo as { text?: string } | undefined;
      return todo?.text ? `Updated to “${todo.text}”` : "Updated task";
    }
    case "update_todo_meta": {
      const todo = record.todo as {
        text?: string;
        dueDate?: string | null;
        recurrence?: string;
      } | undefined;
      if (!todo?.text) return "Updated schedule";
      const bits: string[] = [];
      if (todo.dueDate) bits.push(`due ${todo.dueDate}`);
      if (todo.recurrence && todo.recurrence !== "none") {
        bits.push(todo.recurrence);
      }
      return bits.length
        ? `Updated “${todo.text}” (${bits.join(", ")})`
        : `Updated “${todo.text}” schedule`;
    }
    case "delete_todo":
      return "Deleted task";
    case "clear_completed": {
      const removed = Number(record.removed ?? 0);
      return `Cleared ${removed} completed task${removed === 1 ? "" : "s"}`;
    }
    default:
      return `${toolName} done`;
  }
}
