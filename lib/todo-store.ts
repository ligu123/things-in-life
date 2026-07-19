import { loadTodos, saveTodos } from "@/lib/storage";
import type { Todo } from "@/lib/types";

const EMPTY: Todo[] = [];
const HISTORY_LIMIT = 50;
const HISTORY_KEY = "todo-list:history";

type HistoryState = {
  past: Todo[][];
  future: Todo[][];
};

let memoryTodos: Todo[] | null = null;
let past: Todo[][] = [];
let future: Todo[][] = [];
let historyLoaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function cloneTodos(todos: Todo[]): Todo[] {
  return todos.map((todo) => ({ ...todo }));
}

function loadHistory(): HistoryState {
  if (typeof window === "undefined") return { past: [], future: [] };

  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return { past: [], future: [] };

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { past: [], future: [] };

    const record = parsed as Record<string, unknown>;
    const nextPast = Array.isArray(record.past)
      ? record.past.filter(Array.isArray).map((entry) => cloneTodos(entry as Todo[]))
      : [];
    const nextFuture = Array.isArray(record.future)
      ? record.future
          .filter(Array.isArray)
          .map((entry) => cloneTodos(entry as Todo[]))
      : [];

    return { past: nextPast, future: nextFuture };
  } catch {
    return { past: [], future: [] };
  }
}

function persistHistory() {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ past, future } satisfies HistoryState),
    );
  } catch {
    // Ignore quota / private-mode failures
  }
}

function ensureHistoryLoaded() {
  if (historyLoaded) return;
  historyLoaded = true;
  const loaded = loadHistory();
  past = loaded.past.slice(-HISTORY_LIMIT);
  future = loaded.future.slice(-HISTORY_LIMIT);
}

export function getSnapshot(): Todo[] {
  if (memoryTodos === null) {
    memoryTodos = loadTodos();
  }
  ensureHistoryLoaded();
  return memoryTodos;
}

export function getServerSnapshot(): Todo[] {
  return EMPTY;
}

function applyTodos(next: Todo[]) {
  memoryTodos = cloneTodos(next);
  saveTodos(memoryTodos);
  emit();
}

export function replaceTodos(next: Todo[]) {
  const current = getSnapshot();
  past = [...past, cloneTodos(current)].slice(-HISTORY_LIMIT);
  future = [];
  persistHistory();
  applyTodos(next);
}

export function undoTodos() {
  ensureHistoryLoaded();
  if (past.length === 0) return false;

  const previous = past[past.length - 1];
  past = past.slice(0, -1);
  future = [cloneTodos(getSnapshot()), ...future].slice(-HISTORY_LIMIT);
  persistHistory();
  applyTodos(previous);
  return true;
}

export function redoTodos() {
  ensureHistoryLoaded();
  if (future.length === 0) return false;

  const next = future[0];
  future = future.slice(1);
  past = [...past, cloneTodos(getSnapshot())].slice(-HISTORY_LIMIT);
  persistHistory();
  applyTodos(next);
  return true;
}

export function reorderByVisibleOrder(visibleIds: string[]) {
  const full = cloneTodos(getSnapshot());
  const visibleSet = new Set(visibleIds);
  const slots = full
    .map((todo, index) => (visibleSet.has(todo.id) ? index : -1))
    .filter((index) => index >= 0);
  if (slots.length !== visibleIds.length) return;

  const byId = new Map(full.map((todo) => [todo.id, todo]));
  const next = [...full];
  for (let i = 0; i < visibleIds.length; i++) {
    const todo = byId.get(visibleIds[i]);
    if (!todo) return;
    next[slots[i]] = todo;
  }

  const unchanged = next.every((todo, index) => todo.id === full[index].id);
  if (unchanged) return;
  replaceTodos(next);
}
