"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { EmailAuthForm } from "@/components/EmailAuthForm";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const methodButtonClass =
  "flex w-full items-center justify-center gap-3 rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--surface-muted)]";

export function AuthMethods({
  oauthError,
}: {
  oauthError?: string | null;
}) {
  const [showEmailForm, setShowEmailForm] = useState(Boolean(oauthError));

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {showEmailForm ? (
        <EmailAuthForm mode="login" autoFocusEmail />
      ) : (
        <button
          type="button"
          className={methodButtonClass}
          aria-expanded={false}
          onClick={() => setShowEmailForm(true)}
        >
          <Mail className="size-4 shrink-0" aria-hidden />
          Continue with email
        </button>
      )}

      {showEmailForm ? (
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-xs text-[var(--muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--line)]" />
        </div>
      ) : null}

      <GoogleSignInButton />

      {oauthError ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {oauthError}
        </p>
      ) : null}
    </div>
  );
}
