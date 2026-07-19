import type { Todo } from "./types";

const STORAGE_KEY = "todo-list:todos";

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTodo);
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Ignore quota / private-mode failures
  }
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;

  const todo = value as Record<string, unknown>;
  return (
    typeof todo.id === "string" &&
    typeof todo.text === "string" &&
    typeof todo.completed === "boolean" &&
    typeof todo.createdAt === "number"
  );
}
