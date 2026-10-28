import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthMethods } from "@/components/AuthMethods";
import { AuthScreen } from "@/components/AuthScreen";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function errorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "CredentialsSignin") {
    return "Invalid email or password.";
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
    <AuthScreen>
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
          <h1 className="text-lg font-medium tracking-tight text-[var(--ink)]">
            Things in life,
          </h1>
          <p className="text-lg text-[var(--muted)]">a bit better everyday.</p>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <AuthMethods oauthError={message} />

          <p className="text-sm text-[var(--muted)]">
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--ink)] underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </AuthScreen>
  );
}
