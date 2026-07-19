"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Todo, TodoFilter } from "@/lib/types";
import {
  addTodo,
  clearCompleted,
  deleteTodo,
  editTodo,
  toggleTodo,
} from "@/lib/todo-actions";
import {
  buildShareUrl,
  clearShareHash,
  parseShareHash,
} from "@/lib/share";
import {
  getServerSnapshot,
  getSnapshot,
  redoTodos,
  reorderByVisibleOrder,
  replaceTodos,
  subscribe,
  undoTodos,
} from "@/lib/todo-store";
import { TodoFilters } from "./TodoFilters";
import { TodoInput } from "./TodoInput";
import { TodoList } from "./TodoList";

function isUndoKey(event: KeyboardEvent) {
  return event.code === "KeyZ" && !event.shiftKey;
}

function isRedoKey(event: KeyboardEvent) {
  return (
    (event.code === "KeyZ" && event.shiftKey) || event.code === "KeyY"
  );
}

function isModKey(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && !event.altKey;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) {
    window.prompt("Copy this share link:", text);
  }
}

export function TodoApp() {
  const todos = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [agentMode, setAgentMode] = useState(false);
  const [pendingShare, setPendingShare] = useState<Todo[] | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isModKey(event)) return;

      if (isUndoKey(event)) {
        event.preventDefault();
        event.stopPropagation();
        undoTodos();
        return;
      }

      if (isRedoKey(event)) {
        event.preventDefault();
        event.stopPropagation();
        redoTodos();
      }
    }

    function onBeforeInput(event: Event) {
      const inputEvent = event as InputEvent;
      if (inputEvent.inputType === "historyUndo") {
        inputEvent.preventDefault();
        undoTodos();
        return;
      }
      if (inputEvent.inputType === "historyRedo") {
        inputEvent.preventDefault();
        redoTodos();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("beforeinput", onBeforeInput, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("beforeinput", onBeforeInput, true);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await parseShareHash();
      if (cancelled) return;

      if (result.status === "ok") {
        setPendingShare(result.todos);
        setShareError(null);
        return;
      }

      if (result.status === "error") {
        setShareError(result.message);
        clearShareHash();
        window.setTimeout(() => {
          if (!cancelled) setShareError(null);
        }, 4000);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleShare() {
    const url = await buildShareUrl(getSnapshot());
    await copyText(url);
  }

  function dismissShare() {
    setPendingShare(null);
    clearShareHash();
  }

  function importShare() {
    if (!pendingShare) return;
    replaceTodos(pendingShare);
    setPendingShare(null);
    clearShareHash();
  }

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  const visibleTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const emptyMessage =
    todos.length === 0
      ? agentMode
        ? "No tasks yet — ask the agent to add one."
        : "No tasks yet — add one below."
      : filter === "active"
        ? "No active tasks."
        : filter === "completed"
          ? "No completed tasks yet."
          : agentMode
            ? "No tasks yet — ask the agent to add one."
            : "No tasks yet — add one below.";

  return (
    <div className="todo-shell flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className="todo-tasks mx-auto flex w-full max-w-[650px] flex-col gap-6">
          <TodoFilters
            filter={filter}
            onFilterChange={setFilter}
            totalCount={todos.length}
            activeCount={activeCount}
            completedCount={completedCount}
            onClearCompleted={clearCompleted}
            onShare={handleShare}
          />

          {pendingShare ? (
            <div
              role="region"
              aria-label="Import shared list"
              className="flex flex-col gap-3 rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-[var(--ink)]">
                Import {pendingShare.length} shared{" "}
                {pendingShare.length === 1 ? "task" : "tasks"}? This replaces
                your current list.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={dismissShare}
                  className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={importShare}
                  className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-sm text-[var(--background)] transition-opacity hover:opacity-90"
                >
                  Import
                </button>
              </div>
            </div>
          ) : null}

          {shareError ? (
            <p role="status" className="text-sm text-[var(--muted)]">
              {shareError}
            </p>
          ) : null}

          <section className="todo-panel">
            <TodoList
              todos={visibleTodos}
              onToggle={toggleTodo}
              onEdit={editTodo}
              onDelete={deleteTodo}
              onReorder={reorderByVisibleOrder}
              emptyMessage={emptyMessage}
            />
          </section>
        </div>
      </div>

      <div className="todo-input-bar sticky bottom-0 z-20 bg-[var(--background)]/95 px-5 pb-10 backdrop-blur-sm sm:px-8">
        <div className="relative mx-auto w-full max-w-[650px]">
          <TodoInput
            onAdd={addTodo}
            agentMode={agentMode}
            onAgentModeChange={setAgentMode}
          />
        </div>
      </div>
    </div>
  );
}
