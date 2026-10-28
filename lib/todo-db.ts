import { prisma } from "@/lib/db";
import {
  isDueDateString,
  isRecurrence,
  nextDueDate,
  todayDateString,
} from "@/lib/recurrence";
import type { AddTodoOptions, Recurrence, Todo, UpdateTodoMetaInput } from "@/lib/types";

function toTodo(row: {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  dueDate: string | null;
  recurrence: string;
}): Todo {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.createdAt.getTime(),
    dueDate: row.dueDate,
    recurrence: isRecurrence(row.recurrence) ? row.recurrence : "none",
  };
}

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

export async function listTodosForUser(userId: string): Promise<Todo[]> {
  const rows = await prisma.todo.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toTodo);
}

export async function addTodoForUser(
  userId: string,
  text: string,
  opts: AddTodoOptions = {},
): Promise<{ todo: Todo; todos: Todo[] } | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Text is required" };

  const schedule = resolveSchedule(opts.dueDate, opts.recurrence);
  const minOrder = await prisma.todo.aggregate({
    where: { userId },
    _min: { sortOrder: true },
  });

  const created = await prisma.todo.create({
    data: {
      userId,
      text: trimmed,
      completed: false,
      dueDate: schedule.dueDate,
      recurrence: schedule.recurrence,
      sortOrder: (minOrder._min.sortOrder ?? 0) - 1,
    },
  });

  return { todo: toTodo(created), todos: await listTodosForUser(userId) };
}

export async function toggleTodoForUser(
  userId: string,
  id: string,
): Promise<{ todo: Todo; todos: Todo[] } | { error: string }> {
  const target = await prisma.todo.findFirst({ where: { id, userId } });
  if (!target) return { error: `Todo not found: ${id}` };

  const recurrence = isRecurrence(target.recurrence) ? target.recurrence : "none";
  const completingRecurring = !target.completed && recurrence !== "none";

  const updated = await prisma.todo.update({
    where: { id: target.id },
    data: completingRecurring
      ? {
          completed: false,
          dueDate: nextDueDate(target.dueDate ?? todayDateString(), recurrence),
        }
      : { completed: !target.completed },
  });

  return { todo: toTodo(updated), todos: await listTodosForUser(userId) };
}

export async function editTodoForUser(
  userId: string,
  id: string,
  text: string,
): Promise<{ todo: Todo; todos: Todo[] } | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed) return { error: `Could not edit todo: ${id}` };

  const target = await prisma.todo.findFirst({ where: { id, userId } });
  if (!target) return { error: `Could not edit todo: ${id}` };

  const updated = await prisma.todo.update({
    where: { id: target.id },
    data: { text: trimmed },
  });

  return { todo: toTodo(updated), todos: await listTodosForUser(userId) };
}

export async function updateTodoMetaForUser(
  userId: string,
  id: string,
  meta: UpdateTodoMetaInput,
): Promise<{ todo: Todo; todos: Todo[] } | { error: string }> {
  const target = await prisma.todo.findFirst({ where: { id, userId } });
  if (!target) return { error: `Could not update todo: ${id}` };

  if (meta.dueDate !== undefined && meta.dueDate !== null && !isDueDateString(meta.dueDate)) {
    return { error: "dueDate must be YYYY-MM-DD or null" };
  }
  if (meta.recurrence !== undefined && !isRecurrence(meta.recurrence)) {
    return { error: "Invalid recurrence" };
  }

  const schedule = resolveSchedule(
    meta.dueDate !== undefined ? meta.dueDate : target.dueDate,
    meta.recurrence !== undefined
      ? meta.recurrence
      : isRecurrence(target.recurrence)
        ? target.recurrence
        : "none",
  );

  const updated = await prisma.todo.update({
    where: { id: target.id },
    data: {
      dueDate: schedule.dueDate,
      recurrence: schedule.recurrence,
    },
  });

  return { todo: toTodo(updated), todos: await listTodosForUser(userId) };
}

export async function deleteTodoForUser(
  userId: string,
  id: string,
): Promise<{ deleted: string; todos: Todo[] } | { error: string }> {
  const target = await prisma.todo.findFirst({ where: { id, userId } });
  if (!target) return { error: `Todo not found: ${id}` };

  await prisma.todo.delete({ where: { id: target.id } });
  return { deleted: id, todos: await listTodosForUser(userId) };
}

export async function clearCompletedForUser(
  userId: string,
): Promise<{ removed: number; todos: Todo[] }> {
  const result = await prisma.todo.deleteMany({
    where: { userId, completed: true },
  });
  return { removed: result.count, todos: await listTodosForUser(userId) };
}

export async function replaceAllTodosForUser(
  userId: string,
  todos: Todo[],
): Promise<Todo[]> {
  await prisma.$transaction(async (tx) => {
    await tx.todo.deleteMany({ where: { userId } });
    if (todos.length === 0) return;
    await tx.todo.createMany({
      data: todos.map((todo, index) => ({
        id: todo.id,
        userId,
        text: todo.text,
        completed: todo.completed,
        createdAt: new Date(todo.createdAt),
        dueDate: todo.dueDate,
        recurrence: todo.recurrence,
        sortOrder: index,
      })),
    });
  });
  return listTodosForUser(userId);
}

export async function importLocalTodosForUser(
  userId: string,
  todos: Todo[],
): Promise<Todo[]> {
  const existing = await prisma.todo.count({ where: { userId } });
  if (existing > 0 || todos.length === 0) {
    return listTodosForUser(userId);
  }
  return replaceAllTodosForUser(userId, todos);
}
