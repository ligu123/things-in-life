import type { Recurrence } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RECURRENCES: readonly Recurrence[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
];

export function isRecurrence(value: unknown): value is Recurrence {
  return typeof value === "string" && RECURRENCES.includes(value as Recurrence);
}

export function isDueDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function todayDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nextDueDate(
  from: string,
  recurrence: Exclude<Recurrence, "none">,
): string {
  const base = isDueDateString(from) ? parseLocalDate(from) : parseLocalDate(todayDateString());

  if (recurrence === "daily") {
    base.setDate(base.getDate() + 1);
    return formatLocalDate(base);
  }

  if (recurrence === "weekly") {
    base.setDate(base.getDate() + 7);
    return formatLocalDate(base);
  }

  // monthly: advance calendar month, clamp day (Jan 31 → Feb 28/29)
  const day = base.getDate();
  const targetMonth = base.getMonth() + 1;
  const targetYear = base.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(targetYear, month + 1, 0).getDate();
  return formatLocalDate(new Date(targetYear, month, Math.min(day, lastDay)));
}

export function isOverdue(
  dueDate: string | null,
  completed: boolean,
  now = new Date(),
): boolean {
  if (!dueDate || completed || !isDueDateString(dueDate)) return false;
  return dueDate < todayDateString(now);
}

export function formatDueDateLabel(dueDate: string): string {
  if (!isDueDateString(dueDate)) return dueDate;
  const date = parseLocalDate(dueDate);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export type DuePreset = "today" | "1d" | "1w" | "1m";

export const DUE_PRESETS: { value: DuePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
];

export function dueDateFromPreset(
  preset: DuePreset,
  now = new Date(),
): string {
  const base = parseLocalDate(todayDateString(now));

  if (preset === "today") {
    return formatLocalDate(base);
  }
  if (preset === "1d") {
    base.setDate(base.getDate() + 1);
    return formatLocalDate(base);
  }
  if (preset === "1w") {
    base.setDate(base.getDate() + 7);
    return formatLocalDate(base);
  }

  const day = base.getDate();
  const targetMonth = base.getMonth() + 1;
  const targetYear = base.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(targetYear, month + 1, 0).getDate();
  return formatLocalDate(new Date(targetYear, month, Math.min(day, lastDay)));
}

/** Compact badge label: Today / Tomorrow / 1 week / Overdue / short date. */
export function formatDueBadgeLabel(
  dueDate: string | null,
  completed: boolean,
  now = new Date(),
): string | null {
  if (!dueDate || !isDueDateString(dueDate)) return null;

  const today = todayDateString(now);
  if (dueDate < today && !completed) return "Overdue";
  if (dueDate === today) return "Today";

  const tomorrow = dueDateFromPreset("1d", now);
  if (dueDate === tomorrow) return "1 day";

  const inWeek = dueDateFromPreset("1w", now);
  if (dueDate === inWeek) return "1 week";

  const inMonth = dueDateFromPreset("1m", now);
  if (dueDate === inMonth) return "1 month";

  return formatDueDateLabel(dueDate);
}

export const RECURRENCE_BADGE_LABEL: Record<Exclude<Recurrence, "none">, string> =
  {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };
