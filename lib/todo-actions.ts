"use server";

import { requireUserId } from "@/lib/session";
import {
  addTodoForUser,
  clearCompletedForUser,
  deleteTodoForUser,
  editTodoForUser,
  importLocalTodosForUser,
  listTodosForUser,
  replaceAllTodosForUser,
  toggleTodoForUser,
  updateTodoMetaForUser,
} from "@/lib/todo-db";
import type { AddTodoOptions, Todo, UpdateTodoMetaInput } from "@/lib/types";

export async function listTodos(): Promise<Todo[]> {
  const userId = await requireUserId();
  return listTodosForUser(userId);
}

export async function addTodo(
  text: string,
  opts: AddTodoOptions = {},
): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await addTodoForUser(userId, text, opts);
  if ("error" in result) return listTodosForUser(userId);
  return result.todos;
}

export async function toggleTodo(id: string): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await toggleTodoForUser(userId, id);
  if ("error" in result) return listTodosForUser(userId);
  return result.todos;
}

export async function editTodo(id: string, text: string): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await editTodoForUser(userId, id, text);
  if ("error" in result) return listTodosForUser(userId);
  return result.todos;
}

export async function updateTodoMeta(
  id: string,
  meta: UpdateTodoMetaInput,
): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await updateTodoMetaForUser(userId, id, meta);
  if ("error" in result) return listTodosForUser(userId);
  return result.todos;
}

export async function deleteTodo(id: string): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await deleteTodoForUser(userId, id);
  if ("error" in result) return listTodosForUser(userId);
  return result.todos;
}

export async function clearCompleted(): Promise<Todo[]> {
  const userId = await requireUserId();
  const result = await clearCompletedForUser(userId);
  return result.todos;
}

export async function replaceAllTodos(todos: Todo[]): Promise<Todo[]> {
  const userId = await requireUserId();
  return replaceAllTodosForUser(userId, todos);
}

export async function importLocalTodos(todos: Todo[]): Promise<Todo[]> {
  const userId = await requireUserId();
  return importLocalTodosForUser(userId, todos);
}
