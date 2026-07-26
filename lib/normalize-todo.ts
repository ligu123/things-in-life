import { isDueDateString, isRecurrence } from "./recurrence";
import type { Todo } from "./types";

/** Accept legacy todos missing dueDate/recurrence and normalize to the current shape. */
export function normalizeTodo(value: unknown): Todo | null {
  if (typeof value !== "object" || value === null) return null;

  const todo = value as Record<string, unknown>;
  if (
    typeof todo.id !== "string" ||
    typeof todo.text !== "string" ||
    typeof todo.completed !== "boolean" ||
    typeof todo.createdAt !== "number"
  ) {
    return null;
  }

  const dueDate =
    todo.dueDate === null || todo.dueDate === undefined
      ? null
      : isDueDateString(todo.dueDate)
        ? todo.dueDate
        : null;

  const recurrence = isRecurrence(todo.recurrence) ? todo.recurrence : "none";

  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    createdAt: todo.createdAt,
    dueDate,
    recurrence,
  };
}
