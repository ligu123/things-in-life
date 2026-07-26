"use client";

import { Calendar, Repeat } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DUE_PRESETS,
  RECURRENCE_BADGE_LABEL,
  dueDateFromPreset,
  formatDueBadgeLabel,
  type DuePreset,
} from "@/lib/recurrence";
import type { Recurrence } from "@/lib/types";

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

type GhostBadgeProps = {
  label: string;
  icon: ReactNode;
  active: boolean;
  danger?: boolean;
  open: boolean;
  onToggle: () => void;
  menuId: string;
  ariaLabel: string;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  /** Fill parent width (list columns) vs hug content (composer). */
  fill?: boolean;
};

function GhostBadge({
  label,
  icon,
  active,
  danger,
  open,
  onToggle,
  menuId,
  ariaLabel,
  buttonRef,
  fill = false,
}: GhostBadgeProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={[
        "inline-flex h-6 min-h-6 items-center justify-start gap-1 rounded-md px-1.5 text-xs",
        "[@media(pointer:coarse)]:min-h-9 [@media(pointer:coarse)]:py-1.5",
        // Hug content on mobile; fill fixed columns from sm up when `fill` is set.
        fill ? "w-auto shrink-0 sm:w-full" : "w-auto shrink-0",
        "transition-[background-color,color]",
        open ? "bg-[var(--surface-muted)]" : "hover:bg-[var(--surface-muted)]",
        danger
          ? "text-[var(--danger)]"
          : active
            ? "text-[var(--ink)]"
            : "text-[var(--muted)]",
      ].join(" ")}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

type MenuProps = {
  id: string;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
};

function BadgeMenu({ id, open, onClose, anchorRef, children }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menuWidth = 136;
    const gap = 4;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    );
    let top = rect.bottom + gap;

    const menu = ref.current;
    const menuHeight = menu?.offsetHeight ?? 140;
    if (top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - gap - menuHeight);
    }

    setCoords({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open || !portalReady) {
      if (!open) setCoords(null);
      return;
    }
    updatePosition();
    // Remeasure after paint so flip-above uses real menu height.
    const frame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(frame);
  }, [open, portalReady, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function onReposition() {
      updatePosition();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, onClose, anchorRef, updatePosition]);

  if (!open || !portalReady || !coords) return null;

  return createPortal(
    <div
      ref={ref}
      id={id}
      role="menu"
      style={{ top: coords.top, left: coords.left }}
      className="fixed z-[100] min-w-[8.5rem] overflow-hidden rounded-lg border-[0.5px] border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
    >
      {children}
    </div>,
    document.body,
  );
}

function MenuItem({
  label,
  selected,
  onSelect,
  danger,
}: {
  label: string;
  selected?: boolean;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected ?? false}
      onClick={onSelect}
      className={[
        "flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors",
        "[@media(pointer:coarse)]:py-2.5",
        "hover:bg-[var(--surface-muted)]",
        danger
          ? "text-[var(--danger)]"
          : selected
            ? "text-[var(--ink)]"
            : "text-[var(--muted)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type DueBadgeProps = {
  dueDate: string | null;
  completed?: boolean;
  onChange: (dueDate: string | null) => void;
  placeholder?: string;
  fill?: boolean;
};

export function DueBadge({
  dueDate,
  completed = false,
  onChange,
  placeholder = "Date",
  fill = false,
}: DueBadgeProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const label = formatDueBadgeLabel(dueDate, completed) ?? placeholder;
  const active = Boolean(dueDate);
  const danger = label === "Overdue";
  const close = useCallback(() => setOpen(false), []);

  function pick(preset: DuePreset) {
    onChange(dueDateFromPreset(preset));
    setOpen(false);
  }

  return (
    <div className={fill ? "relative w-auto shrink-0 sm:w-full" : "relative shrink-0"}>
      <GhostBadge
        label={label}
        icon={<Calendar className="size-3" aria-hidden />}
        active={active}
        danger={danger}
        open={open}
        onToggle={() => setOpen((value) => !value)}
        menuId={menuId}
        ariaLabel={active ? `Deadline ${label}` : "Set deadline"}
        buttonRef={buttonRef}
        fill={fill}
      />
      <BadgeMenu
        id={menuId}
        open={open}
        onClose={close}
        anchorRef={buttonRef}
      >
        {DUE_PRESETS.map((preset) => (
          <MenuItem
            key={preset.value}
            label={preset.label}
            selected={
              dueDate !== null && dueDate === dueDateFromPreset(preset.value)
            }
            onSelect={() => pick(preset.value)}
          />
        ))}
        {dueDate ? (
          <MenuItem
            label="Clear"
            danger
            onSelect={() => {
              onChange(null);
              setOpen(false);
            }}
          />
        ) : null}
      </BadgeMenu>
    </div>
  );
}

type RecurrenceBadgeProps = {
  recurrence: Recurrence;
  onChange: (recurrence: Recurrence) => void;
  placeholder?: string;
  fill?: boolean;
};

export function RecurrenceBadge({
  recurrence,
  onChange,
  placeholder = "Repeat",
  fill = false,
}: RecurrenceBadgeProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = recurrence !== "none";
  const label = active ? RECURRENCE_BADGE_LABEL[recurrence] : placeholder;
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className={fill ? "relative w-auto shrink-0 sm:w-full" : "relative shrink-0"}>
      <GhostBadge
        label={label}
        icon={<Repeat className="size-3" aria-hidden />}
        active={active}
        open={open}
        onToggle={() => setOpen((value) => !value)}
        menuId={menuId}
        ariaLabel={active ? `Repeats ${label}` : "Set recurrence"}
        buttonRef={buttonRef}
        fill={fill}
      />
      <BadgeMenu
        id={menuId}
        open={open}
        onClose={close}
        anchorRef={buttonRef}
      >
        {RECURRENCE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            label={option.label}
            selected={recurrence === option.value}
            onSelect={() => {
              onChange(option.value);
              setOpen(false);
            }}
          />
        ))}
      </BadgeMenu>
    </div>
  );
}
