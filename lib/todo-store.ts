"use client";

import { normalizeTodo } from "@/lib/normalize-todo";
import type { Todo } from "@/lib/types";

function normalizeTodoList(value: unknown): Todo[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeTodo)
    .filter((todo): todo is Todo => todo !== null);
}

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
      ? record.past.map(normalizeTodoList)
      : [];
    const nextFuture = Array.isArray(record.future)
      ? record.future.map(normalizeTodoList)
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
    memoryTodos = [];
  }
  ensureHistoryLoaded();
  return memoryTodos;
}

export function getServerSnapshot(): Todo[] {
  return EMPTY;
}

function applyTodos(next: Todo[]) {
  memoryTodos = cloneTodos(next);
  emit();
}

let hydratedFrom: Todo[] | null = null;

export function hydrateTodos(todos: Todo[]) {
  if (hydratedFrom === todos) return;
  hydratedFrom = todos;
  memoryTodos = cloneTodos(todos);
  past = [];
  future = [];
  historyLoaded = true;
  persistHistory();
}

export function syncTodos(next: Todo[]) {
  applyTodos(next);
}

export function replaceTodos(next: Todo[]) {
  const current = getSnapshot();
  past = [...past, cloneTodos(current)].slice(-HISTORY_LIMIT);
  future = [];
  persistHistory();
  applyTodos(next);
}

export function undoLocal(): Todo[] | null {
  ensureHistoryLoaded();
  if (past.length === 0) return null;

  const previous = past[past.length - 1];
  past = past.slice(0, -1);
  future = [cloneTodos(getSnapshot()), ...future].slice(-HISTORY_LIMIT);
  persistHistory();
  applyTodos(previous);
  return previous;
}

export function redoLocal(): Todo[] | null {
  ensureHistoryLoaded();
  if (future.length === 0) return null;

  const next = future[0];
  future = future.slice(1);
  past = [...past, cloneTodos(getSnapshot())].slice(-HISTORY_LIMIT);
  persistHistory();
  applyTodos(next);
  return next;
}

export function reorderByVisibleOrder(visibleIds: string[]): Todo[] | null {
  const full = cloneTodos(getSnapshot());
  const visibleSet = new Set(visibleIds);
  const slots = full
    .map((todo, index) => (visibleSet.has(todo.id) ? index : -1))
    .filter((index) => index >= 0);
  if (slots.length !== visibleIds.length) return null;

  const byId = new Map(full.map((todo) => [todo.id, todo]));
  const next = [...full];
  for (let i = 0; i < visibleIds.length; i++) {
    const todo = byId.get(visibleIds[i]);
    if (!todo) return null;
    next[slots[i]] = todo;
  }

  const unchanged = next.every((todo, index) => todo.id === full[index].id);
  if (unchanged) return null;
  replaceTodos(next);
  return next;
}
