import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth";
import { PRICE_AREA } from "@/shared/config";
import { Wordmark } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Sign in · Nordic Power & Weather Explorer",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col gap-4">
        <Wordmark />

        <h1 className="text-display font-semibold text-fg">Sign in</h1>
        <p className="text-fg-secondary">
          The {PRICE_AREA.label} dashboard is password protected. Enter the shared
          password to continue.
        </p>
      </div>

      <LoginForm />

      <Link href="/" className="text-sm text-link underline underline-offset-2">
        Back to the overview
      </Link>
    </div>
  );
}
