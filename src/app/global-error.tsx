"use client";

/*
 * Replaces the root layout when it fails, so it renders its own <html> and <body> — and
 * does not inherit global styles, hence the explicit import below.
 */
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-page">
        <title>Something went wrong</title>

        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
          <h1 className="text-3xl font-semibold text-fg">Something went wrong</h1>

          <p className="text-fg-secondary">
            The application failed to load. Retrying re-requests everything from the
            start.
          </p>

          {error.digest ? (
            <p className="font-mono text-xs text-fg-muted">Reference: {error.digest}</p>
          ) : null}

          <button
            type="button"
            onClick={retry}
            className="mt-2 self-start rounded-pill bg-action-primary px-7 py-2.5 font-medium text-on-action-primary"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
