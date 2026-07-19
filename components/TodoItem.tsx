"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Trash2 } from "lucide-react";
import type { Todo } from "@/lib/types";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  canReorder: boolean;
};

export function TodoItem({
  todo,
  onToggle,
  onEdit,
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
        // Include the grip in the measured box so drag offset stays correct.
        "todo-item group relative -ml-11 pl-11 last:[&>div]:border-b-0",
        todo.completed ? "completed" : "",
        isDragging ? "z-10 opacity-10" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={canReorder ? 0 : -1}
        aria-label="Drag to reorder"
        aria-disabled={!canReorder}
        className={[
          "absolute top-1/2 left-0 z-10 flex h-9 w-9 -translate-y-1/2",
          "cursor-grab items-center justify-center rounded-md touch-none",
          "text-[var(--muted)] opacity-0 transition-opacity active:cursor-grabbing",
          "group-hover:opacity-100 focus-visible:opacity-100",
          canReorder ? "" : "pointer-events-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <GripVertical className="pointer-events-none size-4" aria-hidden />
      </span>

      <div className="relative flex items-center border-b-[0.5px] border-[var(--line)] py-2">
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          aria-label={todo.completed ? "Mark as active" : "Mark as completed"}
          className="group/check flex h-7 shrink-0 items-center justify-center py-1 pr-3 pl-0.5"
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

        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete “${todo.text}”`}
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            "color-danger opacity-100",
            "transition-[opacity,color,background-color]",
            "hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]",
            "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
          ].join(" ")}
        >
          <Trash2 className="size-4 text-[var(--danger)]" aria-hidden />
        </button>
      </div>
    </li>
  );
}

type TodoItemOverlayProps = {
  todo: Todo;
};

export function TodoItemOverlay({ todo }: TodoItemOverlayProps) {
  return (
    <div className="relative w-full cursor-grabbing bg-[var(--surface)] pl-11 shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-xl dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
      <span
        className="absolute top-1/2 left-0 flex h-10 w-8 -translate-y-1/2 items-center justify-center text-[var(--muted)]"
        aria-hidden
      >
        <GripVertical className="size-4" aria-hidden />
      </span>
      <div className="flex items-center gap-3 py-2">
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
      </div>
    </div>
  );
}
