"use client";

import type { TodoFilter } from "@/lib/types";
import { TodoOptionsMenu } from "./TodoOptionsMenu";

type TodoFiltersProps = {
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  onClearCompleted: () => void;
  onShare: () => Promise<void>;
};

const FILTERS: { id: TodoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Done" },
];

export function TodoFilters({
  filter,
  onFilterChange,
  totalCount,
  activeCount,
  completedCount,
  onClearCompleted,
  onShare,
}: TodoFiltersProps) {
  const counts: Record<TodoFilter, number> = {
    all: totalCount,
    active: activeCount,
    completed: completedCount,
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div
        role="tablist"
        aria-label="Filter tasks"
        className="inline-flex shrink-0 rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface-muted)] p-1 gap-0"
      >
        {FILTERS.map(({ id, label }) => {
          const selected = filter === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onFilterChange(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
              <span
                className={
                  selected ? "text-[var(--muted)]" : "text-[var(--line-strong)]"
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <TodoOptionsMenu
        totalCount={totalCount}
        completedCount={completedCount}
        onClearCompleted={onClearCompleted}
        onShare={onShare}
      />
    </div>
  );
}
