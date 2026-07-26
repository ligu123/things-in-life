"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
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
  "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)] disabled:pointer-events-none disabled:opacity-40 sm:py-1.5";

function useCoarsePointer() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

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
  const coarsePointer = useCoarsePointer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share list");
  const [themeCoords, setThemeCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeTriggerRef = useRef<HTMLButtonElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const shareResetRef = useRef<number | null>(null);
  const themeCloseTimerRef = useRef<number | null>(null);
  const menuId = useId();
  const themeMenuId = useId();

  const themeLabel =
    THEME_OPTIONS.find((option) => option.id === themeMode)?.label ?? "System";

  const cancelThemeClose = useCallback(() => {
    if (themeCloseTimerRef.current !== null) {
      window.clearTimeout(themeCloseTimerRef.current);
      themeCloseTimerRef.current = null;
    }
  }, []);

  const openThemeMenu = useCallback(() => {
    cancelThemeClose();
    setThemeMenuOpen(true);
  }, [cancelThemeClose]);

  const scheduleThemeClose = useCallback(() => {
    if (coarsePointer) return;
    cancelThemeClose();
    themeCloseTimerRef.current = window.setTimeout(() => {
      setThemeMenuOpen(false);
      themeCloseTimerRef.current = null;
    }, 140);
  }, [coarsePointer, cancelThemeClose]);

  const closeMenus = useCallback(() => {
    cancelThemeClose();
    setMenuOpen(false);
    setThemeMenuOpen(false);
  }, [cancelThemeClose]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (shareResetRef.current !== null) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  const updateThemePosition = useCallback(() => {
    const trigger = themeTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 144;
    const menuHeight = themeMenuRef.current?.offsetHeight ?? 120;
    const gap = 6;

    // Prefer left of the trigger (main menu is right-aligned).
    let left = rect.left - menuWidth - gap;
    if (left < 8) {
      // Stack below the Theme row when there's no room on the left.
      left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
      const top = rect.bottom + gap;
      if (top + menuHeight > window.innerHeight - 8) {
        setThemeCoords({
          top: Math.max(8, rect.top - gap - menuHeight),
          left: Math.max(8, left),
        });
        return;
      }
      setThemeCoords({ top, left: Math.max(8, left) });
      return;
    }

    let top = rect.top;
    if (top + menuHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - menuHeight - 8);
    }
    setThemeCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!themeMenuOpen || !portalReady) {
      if (!themeMenuOpen) setThemeCoords(null);
      return;
    }
    updateThemePosition();
    const frame = requestAnimationFrame(updateThemePosition);
    return () => cancelAnimationFrame(frame);
  }, [themeMenuOpen, portalReady, updateThemePosition]);

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
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (themeMenuRef.current?.contains(target)) return;
      closeMenus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (themeMenuOpen) {
        setThemeMenuOpen(false);
        return;
      }
      closeMenus();
    }

    function onReposition() {
      if (themeMenuOpen) updateThemePosition();
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
  }, [menuOpen, themeMenuOpen, closeMenus, updateThemePosition]);

  const themePanel =
    themeMenuOpen && portalReady && themeCoords
      ? createPortal(
          <div
            ref={themeMenuRef}
            id={themeMenuId}
            role="menu"
            aria-label="Theme"
            style={{ top: themeCoords.top, left: themeCoords.left }}
            className="fixed z-[110] w-36 overflow-hidden rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
            onMouseEnter={openThemeMenu}
            onMouseLeave={scheduleThemeClose}
          >
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
                    if (coarsePointer) setThemeMenuOpen(false);
                  }}
                  className="mx-1 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)] sm:py-2"
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
          </div>,
          document.body,
        )
      : null;

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
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] sm:h-8 sm:w-8"
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
            onMouseEnter={openThemeMenu}
            onMouseLeave={scheduleThemeClose}
          >
            <button
              ref={themeTriggerRef}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={themeMenuOpen}
              aria-controls={themeMenuId}
              onClick={() => {
                if (coarsePointer) {
                  setThemeMenuOpen((open) => !open);
                }
              }}
              onFocus={openThemeMenu}
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

      {themePanel}
    </div>
  );
}
