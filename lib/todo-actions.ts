import {
  isDueDateString,
  isRecurrence,
  nextDueDate,
  todayDateString,
} from "@/lib/recurrence";
import { getSnapshot, replaceTodos } from "@/lib/todo-store";
import type { Recurrence, Todo } from "@/lib/types";

export type AddTodoOptions = {
  dueDate?: string | null;
  recurrence?: Recurrence;
};

export type UpdateTodoMetaInput = {
  dueDate?: string | null;
  recurrence?: Recurrence;
};

function resolveSchedule(
  dueDate: string | null | undefined,
  recurrence: Recurrence | undefined,
): { dueDate: string | null; recurrence: Recurrence } {
  const nextRecurrence = recurrence ?? "none";
  let nextDue =
    dueDate === undefined
      ? null
      : dueDate === null
        ? null
        : isDueDateString(dueDate)
          ? dueDate
          : null;

  if (nextRecurrence !== "none" && !nextDue) {
    nextDue = todayDateString();
  }

  return { dueDate: nextDue, recurrence: nextRecurrence };
}

export function listTodos(): Todo[] {
  return getSnapshot().map((todo) => ({ ...todo }));
}

export function addTodo(text: string, opts: AddTodoOptions = {}): Todo {
  const schedule = resolveSchedule(opts.dueDate, opts.recurrence);
  const todo: Todo = {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
    dueDate: schedule.dueDate,
    recurrence: schedule.recurrence,
  };
  replaceTodos([todo, ...getSnapshot()]);
  return todo;
}

export function toggleTodo(id: string): Todo | null {
  const current = getSnapshot();
  const target = current.find((todo) => todo.id === id);
  if (!target) return null;

  const next = current.map((todo) => {
    if (todo.id !== id) return todo;

    // Completing a recurring task rolls the deadline forward and stays active.
    if (!todo.completed && todo.recurrence !== "none") {
      const from = todo.dueDate ?? todayDateString();
      return {
        ...todo,
        completed: false,
        dueDate: nextDueDate(from, todo.recurrence),
      };
    }

    return { ...todo, completed: !todo.completed };
  });

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

export function updateTodoMeta(
  id: string,
  meta: UpdateTodoMetaInput,
): Todo | null {
  const current = getSnapshot();
  const target = current.find((todo) => todo.id === id);
  if (!target) return null;

  if (meta.dueDate !== undefined && meta.dueDate !== null && !isDueDateString(meta.dueDate)) {
    return null;
  }
  if (meta.recurrence !== undefined && !isRecurrence(meta.recurrence)) {
    return null;
  }

  const nextDueDate =
    meta.dueDate !== undefined ? meta.dueDate : target.dueDate;
  const nextRecurrence =
    meta.recurrence !== undefined ? meta.recurrence : target.recurrence;
  const schedule = resolveSchedule(nextDueDate, nextRecurrence);

  const next = current.map((todo) =>
    todo.id === id
      ? {
          ...todo,
          dueDate: schedule.dueDate,
          recurrence: schedule.recurrence,
        }
      : todo,
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
