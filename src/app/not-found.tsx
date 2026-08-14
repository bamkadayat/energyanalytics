import Link from "next/link";
import { buttonClasses, Wordmark } from "@/shared/ui";

/**
 * 404. Reached by any unmatched path.
 *
 * Says what happened and offers the two places worth going, rather than an apology and a
 * dead end. Errors in this app never apologise — they explain and offer a way on.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4 py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Wordmark />

        <div className="flex flex-col gap-3">
          <p className="font-mono text-sm text-fg-muted">404</p>
          <h1 className="text-3xl font-semibold text-fg">This page does not exist</h1>
          <p className="text-fg-secondary">
            The address may be mistyped, or the page may have moved. The dashboard is
            still here.
          </p>
        </div>

        {/*
          One way on, not two. The second button pointed at the landing page; with that
          gone the dashboard is the only destination this app has.
        */}
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClasses()}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
