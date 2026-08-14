import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth";
import { hasValidSession } from "@/features/auth/api/session";
import { getDemoPasswordHint } from "@/shared/config/server";
import { LogoMark } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Login · Nordic Power & Weather Explorer",
};

/** Reading the session is request-time work, so this route is allowed to block. */
export const instant = false;

/**
 * Login page.
 */
export default async function LoginPage() {
  if (await hasValidSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-surface px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-line text-fg">
        <div className="flex flex-col gap-8 p-8 sm:p-10">
          <div className="flex flex-col gap-4">
            <span className="flex items-center gap-3">
              <LogoMark className="size-7 shrink-0" />
              <span className="text-lg font-semibold tracking-tight">
                Nordic Power &amp; Weather
              </span>
            </span>
          </div>

          <h1 className="text-3xl font-semibold">Log in</h1>
          <LoginForm />
          <DemoPasswordNote />
        </div>
      </div>

    </div>
  );
}
function DemoPasswordNote() {
  const hint = getDemoPasswordHint();

  if (hint === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-5">
      <p className="text-sm text-fg-secondary">
        Use password{" "}
        <code className="select-all rounded-control border border-line-strong px-2 py-0.5 font-mono text-fg">
          {hint}
        </code>
      </p>
    </div>
  );
}
