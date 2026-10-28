"use client";

import { useActionState } from "react";
import {
  registerWithCredentials,
  signInWithCredentials,
  type AuthFormState,
} from "@/lib/auth-actions";

const inputClass =
  "auth-input w-full rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]";

const buttonClass =
  "flex w-full items-center justify-center rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-50";

export function EmailAuthForm({
  mode,
  autoFocusEmail = false,
}: {
  mode: "login" | "signup";
  autoFocusEmail?: boolean;
}) {
  const action = mode === "signup" ? registerWithCredentials : signInWithCredentials;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-8 text-left">
      <div className="flex flex-col gap-3">
        {mode === "signup" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">Name</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder="Optional"
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">Email</span>
          <input
            name="email"
            type="email"
            required
            autoFocus={autoFocusEmail}
            autoComplete={mode === "signup" ? "email" : "username"}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            className={inputClass}
          />
        </label>

        {mode === "signup" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">
              Confirm password
            </span>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat password"
              className={inputClass}
            />
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {state?.error ? (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {state.error}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={buttonClass}>
          {pending
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </div>
    </form>
  );
}
