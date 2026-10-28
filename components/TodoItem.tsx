"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Trash2 } from "lucide-react";
import {
  formatDueBadgeLabel,
  isOverdue,
} from "@/lib/recurrence";
import type { Recurrence, Todo, UpdateTodoMetaInput } from "@/lib/types";
import { DueBadge, RecurrenceBadge } from "./TodoMetaBadges";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onUpdateMeta: (id: string, meta: UpdateTodoMetaInput) => void;
  onDelete: (id: string) => void;
  canReorder: boolean;
};

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onUpdateMeta,
  onDelete,
  canReorder,
}: TodoItemProps) {
  const [draft, setDraft] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    disabled: !canReorder,
  });

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDraft(todo.text);
    }
  }, [todo.text]);

  function commitEdit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(todo.text);
      return;
    }
    if (trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    } else if (trimmed !== draft) {
      setDraft(trimmed);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
      inputRef.current?.blur();
      return;
    }
    if (event.key === "Escape") {
      setDraft(todo.text);
      inputRef.current?.blur();
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={[
        // Desktop: include grip overhang in the measured box for drag offset.
        "todo-item group relative sm:-ml-11 sm:pl-11 last:[&>div]:border-b-0",
        todo.completed ? "completed" : "",
        isDragging ? "z-10 opacity-10" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative flex items-center border-b-[0.5px] border-[var(--line)] py-2">
        <span
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={canReorder ? 0 : -1}
          aria-label="Drag to reorder"
          aria-disabled={!canReorder}
          className={[
            "z-10 flex shrink-0 cursor-grab items-center justify-center rounded-md touch-none",
            "text-[var(--muted)] transition-opacity active:cursor-grabbing",
            // Mobile: inline, always visible. Desktop: absolute gutter, hover-gated.
            "relative h-10 w-8 opacity-50",
            "sm:absolute sm:top-1/2 sm:-left-11 sm:h-9 sm:w-9 sm:-translate-y-1/2",
            "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            canReorder ? "" : "pointer-events-none !opacity-0",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <GripVertical className="pointer-events-none size-4" aria-hidden />
        </span>

        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
          className="group/check flex h-10 w-10 shrink-0 items-center justify-center sm:h-7 sm:w-auto sm:py-1 sm:pr-3 sm:pl-0.5"
        >
          <span
            className={`flex size-3 items-center justify-center rounded-full border-[0.5px] transition-[background-color,border-color,transform] ${
              todo.completed
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                : "border-[var(--line-strong)] bg-transparent group-hover/check:border-[var(--accent)]"
            }`}
          >
            {todo.completed ? (
              <Check className="size-2" strokeWidth={3} aria-hidden />
            ) : null}
          </span>
        </button>

        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          aria-label="Edit task"
          className={`min-w-0 flex-1 bg-transparent py-0.5 text-sm leading-snug outline-none transition-colors ${
            todo.completed
              ? "text-[var(--muted)] line-through decoration-[var(--line-strong)]"
              : "text-[var(--ink)]"
          }`}
        />

        {/* Mobile: content-sized badges. sm+: fixed columns for vertical alignment. */}
        <div className="ml-1 flex shrink-0 items-center gap-0.5 sm:ml-2 sm:grid sm:grid-cols-[4.75rem_4.5rem_2rem]">
          <DueBadge
            dueDate={todo.dueDate}
            completed={todo.completed}
            onChange={(dueDate) => onUpdateMeta(todo.id, { dueDate })}
            fill
          />
          <RecurrenceBadge
            recurrence={todo.recurrence}
            onChange={(recurrence: Recurrence) =>
              onUpdateMeta(todo.id, { recurrence })
            }
            fill
          />
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete “${todo.text}”`}
            className={[
              "flex h-10 w-10 items-center justify-center justify-self-end rounded-md sm:h-8 sm:w-8",
              "color-danger",
              "transition-[opacity,color,background-color]",
              "hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]",
              "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
            ].join(" ")}
          >
            <Trash2 className="size-4 text-[var(--danger)]" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

type TodoItemOverlayProps = {
  todo: Todo;
};

export function TodoItemOverlay({ todo }: TodoItemOverlayProps) {
  const dueLabel = formatDueBadgeLabel(todo.dueDate, todo.completed);

  return (
    <div className="relative w-full cursor-grabbing rounded-xl bg-[var(--surface)] pl-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:pl-11 dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
      <span
        className="absolute top-1/2 left-0 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[var(--muted)]"
        aria-hidden
      >
        <GripVertical className="size-4" aria-hidden />
      </span>
      <div className="flex items-center gap-3 py-2 pl-8 sm:pl-0">
        <span
          className={`flex size-3 shrink-0 rounded-full border-[0.5px] ${
            todo.completed
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--line-strong)]"
          }`}
        />
        <span
          className={`min-w-0 flex-1 truncate text-sm leading-snug ${
            todo.completed
              ? "text-[var(--muted)] line-through decoration-[var(--line-strong)]"
              : "text-[var(--ink)]"
          }`}
        >
          {todo.text}
        </span>
        {dueLabel ? (
          <span
            className={`shrink-0 text-xs ${
              isOverdue(todo.dueDate, todo.completed)
                ? "text-[var(--danger)]"
                : "text-[var(--muted)]"
            }`}
          >
            {dueLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
