import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthScreen } from "@/components/AuthScreen";
import { EmailAuthForm } from "@/components/EmailAuthForm";

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <AuthScreen>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-lg font-medium tracking-tight text-[var(--ink)]">
            Create an account
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Your lists stay private to you.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <EmailAuthForm mode="signup" autoFocusEmail />

          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthScreen>
  );
}
