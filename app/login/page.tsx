import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function errorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "AccessDenied") {
    return "This Google account isn’t allowed to use Things in life.";
  }
  if (error === "Configuration") {
    return "Sign-in isn’t configured yet. Try again in a moment.";
  }
  return "Something went wrong signing in. Please try again.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const { error } = await searchParams;
  const message = errorMessage(error);

  return (
    <div className="app-canvas flex min-h-full flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-medium tracking-tight text-[var(--ink)]">
              Things in life,
            </h1>
            <p className="text-xl text-[var(--muted)]">
              a bit better everyday.
            </p>
          </div>

          <div className="flex w-full flex-col items-center gap-3">
            <form action={signInWithGoogle} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border-[0.5px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--surface-muted)]"
              >
                <GoogleMark />
                Continue with Google
              </button>
            </form>
            {message ? (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
