import { LoginRiverBackground } from "@/components/LoginRiverBackground";
import {
  LOGIN_WAVES_DISPLAY_HEIGHT,
  LOGIN_WAVES_DISPLAY_WIDTH,
} from "@/lib/login-waves-paths";

export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas relative flex min-h-full flex-1 flex-col">
      <main className="login-content relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-16 flex justify-center">
            <LoginRiverBackground />
          </div>

          {children}

          <div
            className="pointer-events-none invisible mt-16 shrink-0"
            style={{
              height: LOGIN_WAVES_DISPLAY_HEIGHT,
              width: LOGIN_WAVES_DISPLAY_WIDTH,
            }}
            aria-hidden
          />
        </div>
      </main>
    </div>
  );
}
