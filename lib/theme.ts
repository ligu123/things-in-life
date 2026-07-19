export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "todo-list:theme";
const listeners = new Set<() => void>();

let mode: ThemeMode = "system";
let resolved: "light" | "dark" = "light";
let media: MediaQueryList | null = null;
let loaded = false;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function getSystemDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveMode(next: ThemeMode): "light" | "dark" {
  if (next === "system") return getSystemDark() ? "dark" : "light";
  return next;
}

function applyResolved(next: "light" | "dark") {
  resolved = next;
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.style.colorScheme = next;
}

function persist(next: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore quota / private-mode failures
  }
}

function readStored(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Ignore
  }
  return "system";
}

function onMediaChange() {
  if (mode !== "system") return;
  applyResolved(resolveMode("system"));
  emit();
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  mode = readStored();
  media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onMediaChange);
  applyResolved(resolveMode(mode));
}

export function subscribeTheme(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getThemeMode(): ThemeMode {
  ensureLoaded();
  return mode;
}

export function getResolvedTheme(): "light" | "dark" {
  ensureLoaded();
  return resolved;
}

export function getServerThemeMode(): ThemeMode {
  return "system";
}

export function setThemeMode(next: ThemeMode) {
  ensureLoaded();
  mode = next;
  persist(next);
  applyResolved(resolveMode(next));
  emit();
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"system";var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
