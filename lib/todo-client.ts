"use client";

import {
  addTodo as addTodoAction,
  clearCompleted as clearCompletedAction,
  deleteTodo as deleteTodoAction,
  editTodo as editTodoAction,
  importLocalTodos as importLocalTodosAction,
  listTodos as listTodosAction,
  replaceAllTodos as replaceAllTodosAction,
  toggleTodo as toggleTodoAction,
  updateTodoMeta as updateTodoMetaAction,
} from "@/lib/todo-actions";
import {
  redoLocal,
  reorderByVisibleOrder as reorderLocal,
  replaceTodos,
  syncTodos,
  undoLocal,
} from "@/lib/todo-store";
import type { AddTodoOptions, Todo, UpdateTodoMetaInput } from "@/lib/types";

export async function addTodo(text: string, opts: AddTodoOptions = {}) {
  replaceTodos(await addTodoAction(text, opts));
}

export async function toggleTodo(id: string) {
  replaceTodos(await toggleTodoAction(id));
}

export async function editTodo(id: string, text: string) {
  replaceTodos(await editTodoAction(id, text));
}

export async function updateTodoMeta(id: string, meta: UpdateTodoMetaInput) {
  replaceTodos(await updateTodoMetaAction(id, meta));
}

export async function deleteTodo(id: string) {
  replaceTodos(await deleteTodoAction(id));
}

export async function clearCompleted() {
  replaceTodos(await clearCompletedAction());
}

export async function replaceAllTodos(todos: Todo[]) {
  replaceTodos(await replaceAllTodosAction(todos));
}

export async function refreshTodos() {
  syncTodos(await listTodosAction());
}

export async function importLocalTodos(todos: Todo[]) {
  syncTodos(await importLocalTodosAction(todos));
}

export async function undoTodos() {
  const previous = undoLocal();
  if (!previous) return false;
  await replaceAllTodosAction(previous);
  return true;
}

export async function redoTodos() {
  const next = redoLocal();
  if (!next) return false;
  await replaceAllTodosAction(next);
  return true;
}

export async function reorderByVisibleOrder(visibleIds: string[]) {
  const next = reorderLocal(visibleIds);
  if (!next) return;
  await replaceAllTodosAction(next);
}
