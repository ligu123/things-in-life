import { getSnapshot, replaceTodos } from "@/lib/todo-store";
import type { Todo } from "@/lib/types";

export function listTodos(): Todo[] {
  return getSnapshot().map((todo) => ({ ...todo }));
}

export function addTodo(text: string): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };
  replaceTodos([todo, ...getSnapshot()]);
  return todo;
}

export function toggleTodo(id: string): Todo | null {
  const current = getSnapshot();
  const target = current.find((todo) => todo.id === id);
  if (!target) return null;

  const next = current.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo,
  );
  replaceTodos(next);
  return next.find((todo) => todo.id === id) ?? null;
}

export function editTodo(id: string, text: string): Todo | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const current = getSnapshot();
  if (!current.some((todo) => todo.id === id)) return null;

  const next = current.map((todo) =>
    todo.id === id ? { ...todo, text: trimmed } : todo,
  );
  replaceTodos(next);
  return next.find((todo) => todo.id === id) ?? null;
}

export function deleteTodo(id: string): boolean {
  const current = getSnapshot();
  if (!current.some((todo) => todo.id === id)) return false;
  replaceTodos(current.filter((todo) => todo.id !== id));
  return true;
}

export function clearCompleted(): number {
  const current = getSnapshot();
  const remaining = current.filter((todo) => !todo.completed);
  const removed = current.length - remaining.length;
  if (removed > 0) replaceTodos(remaining);
  return removed;
}
