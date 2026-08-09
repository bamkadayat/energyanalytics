import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowLeft, FiLogIn } from "react-icons/fi";
import { LoginForm } from "@/features/auth";
import { PRICE_AREA } from "@/shared/config";

export const metadata: Metadata = {
  title: "Sign in · Nordic Power & Weather Explorer",
};

/**
 * Sign-in page.
 *
 * The card follows the reference layout — badge, heading, supporting line, one field, a
 * full-width action — but carries only the controls this app actually has. There is no
 * email field, no "forgot password" and no social sign-in, because a single shared
 * password means none of them could do anything. A control that cannot work is worse
 * than a missing one.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-16">
      <div className="w-full max-w-md">
        <div className="animate-enter flex flex-col gap-6 rounded-card border border-line bg-surface p-8 shadow-card">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-card bg-surface-inverse text-fg-inverse">
              <FiLogIn aria-hidden="true" className="size-6" />
            </span>

            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold text-fg">Sign in</h1>
              <p className="text-pretty text-fg-muted">
                The {PRICE_AREA.label} dashboard is password protected. Enter the shared
                password to continue.
              </p>
            </div>
          </div>

          <LoginForm />
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-link underline-offset-4 hover:underline"
        >
          <FiArrowLeft aria-hidden="true" className="size-4" />
          Back to the overview
        </Link>
      </div>
    </div>
  );
}
