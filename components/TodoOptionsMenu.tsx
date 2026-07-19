"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  Check,
  ChevronRight,
  EllipsisVertical,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Share2,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";
import {
  getServerThemeMode,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
} from "@/lib/theme";

type TodoOptionsMenuProps = {
  totalCount: number;
  completedCount: number;
  onClearCompleted: () => void;
  onShare: () => Promise<void>;
};

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const menuItemClass =
  "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)] disabled:pointer-events-none disabled:opacity-40";

export function TodoOptionsMenu({
  totalCount,
  completedCount,
  onClearCompleted,
  onShare,
}: TodoOptionsMenuProps) {
  const themeMode = useSyncExternalStore(
    subscribeTheme,
    getThemeMode,
    getServerThemeMode,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share list");
  const menuRef = useRef<HTMLDivElement>(null);
  const shareResetRef = useRef<number | null>(null);
  const menuId = useId();
  const themeMenuId = useId();

  const themeLabel =
    THEME_OPTIONS.find((option) => option.id === themeMode)?.label ?? "System";

  function closeMenus() {
    setMenuOpen(false);
    setThemeMenuOpen(false);
  }

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  async function handleShare() {
    try {
      await onShare();
      setShareLabel("Copied");
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      shareResetRef.current = window.setTimeout(() => {
        setShareLabel("Share list");
        shareResetRef.current = null;
      }, 1600);
    } catch {
      setShareLabel("Share failed");
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
      shareResetRef.current = window.setTimeout(() => {
        setShareLabel("Share list");
        shareResetRef.current = null;
      }, 1600);
    }
  }

  useEffect(() => {
    if (!menuOpen) {
      setThemeMenuOpen(false);
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        closeMenus();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (themeMenuOpen) {
        setThemeMenuOpen(false);
        return;
      }
      closeMenus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, themeMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={() => {
          setMenuOpen((open) => !open);
          setThemeMenuOpen(false);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
      >
        <EllipsisVertical className="size-4" aria-hidden />
      </button>

      {menuOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="List options"
          className="absolute right-0 top-full z-20 mt-1.5 w-48 rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
        >
          <button
            type="button"
            role="menuitem"
            disabled={totalCount === 0}
            onClick={() => {
              void handleShare();
            }}
            className={menuItemClass}
          >
            <Share2 className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
            {shareLabel}
          </button>

          <div
            role="separator"
            className="my-1 border-t-[0.5px] border-[var(--line)]"
          />

          <button
            type="button"
            role="menuitem"
            disabled={completedCount === 0}
            onClick={() => {
              onClearCompleted();
              closeMenus();
            }}
            className={menuItemClass}
          >
            <ListChecks className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
            Clear completed
          </button>

          <div
            role="separator"
            className="my-1 border-t-[0.5px] border-[var(--line)]"
          />

          <div
            className="relative"
            onMouseEnter={() => setThemeMenuOpen(true)}
            onMouseLeave={() => setThemeMenuOpen(false)}
          >
            <button
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={themeMenuOpen}
              aria-controls={themeMenuId}
              onFocus={() => setThemeMenuOpen(true)}
              className={`${menuItemClass} justify-between`}
            >
              <span className="flex items-center gap-2">
                <Palette className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
                Theme
              </span>
              <span className="flex items-center gap-1 text-[var(--muted)]">
                {themeLabel}
                <ChevronRight className="size-3" aria-hidden />
              </span>
            </button>

            {themeMenuOpen ? (
              <div
                id={themeMenuId}
                role="menu"
                aria-label="Theme"
                className="absolute left-full top-0 z-30 flex"
              >
                <div className="w-1.5 shrink-0" aria-hidden />
                <div className="w-36 overflow-hidden rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
                  {THEME_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const selected = themeMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          setThemeMode(id);
                        }}
                        className="mx-1 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)]"
                      >
                        <span className="flex items-center gap-2">
                          <Icon
                            className="size-3.5 shrink-0 text-[var(--muted)]"
                            aria-hidden
                          />
                          {label}
                        </span>
                        {selected ? (
                          <Check
                            className="size-3 text-[var(--ink)]"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        ) : (
                          <span className="h-3 w-3" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div
            role="separator"
            className="my-1 border-t-[0.5px] border-[var(--line)]"
          />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenus();
              void signOutAction();
            }}
            className={menuItemClass}
          >
            <LogOut className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
