"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClasses, StatusMessage, Wordmark } from "@/shared/ui";

/**
 * Route-level error boundary.
 *
 * The prop is `retry`, not `reset` — it became stable in Next 16.3. `retry()` re-fetches
 * and re-renders the boundary's children, where `reset()` only re-renders, which for a
 * data-fetching failure would show the same error again.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Stands in for a reporting service. Without this the digest is the only thread back
    // to what actually failed in production.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Wordmark />

        <StatusMessage
          tone="error"
          title="Something went wrong loading this page"
          action={
            <button type="button" onClick={retry} className={buttonClasses()}>
              Try again
            </button>
          }
        >
          The page could not be rendered. Retrying re-requests the data — if a provider
          was briefly unavailable, that is usually enough.
          {/*
            The digest, not the message. Error messages are scrubbed in production
            builds, and printing a raw one would risk leaking internals for no benefit.
          */}
          {error.digest ? (
            <span className="mt-2 block font-mono text-xs">
              Reference: {error.digest}
            </span>
          ) : null}
        </StatusMessage>

        <Link href="/dashboard" className={buttonClasses({ variant: "outline" })}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
