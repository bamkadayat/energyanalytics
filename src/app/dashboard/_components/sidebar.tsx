import Link from "next/link";
import { FiLogOut } from "react-icons/fi";
import { logout } from "@/features/auth";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent, type RailContentProps } from "./rail-content";

/**
 * The application rail, from `lg` up; below that the same `RailContent` fills the drawer.
 * Every entry is a real filter or anchor — a rail of dead links behaves like a mock-up.
 */
export function DashboardSidebar({
  params,
  active,
}: {
  params: ViewParams;
  active?: RailContentProps["active"];
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface-rail text-fg-inverse lg:flex">
      {/*
        The way home. From `/dashboard/hours` the rail's only other route is the page you
        are on, so without this there is nothing but the back button.
      */}
      <div className="border-b border-line-inverse px-4 py-4">
        <Link
          href="/dashboard"
          scroll={false}
          className="-mx-2 flex rounded-control px-2 py-1 hover:bg-surface-rail-active focus-visible:outline-fg-inverse"
        >
          <Wordmark tone="inverse" short />
        </Link>
      </div>

      <nav
        aria-label="Dashboard"
        className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-5"
      >
        <RailContent params={params} active={active} />
      </nav>

      {/* Logout is used once a session, so it sits at the foot, not beside the data. */}
      <div className="border-t border-line-inverse px-3 py-3">
        <form action={logout}>
          {/* At 16px in muted navy on navy it was present and unreadable. */}
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-fg-inverse hover:bg-surface-rail-active"
          >
            <FiLogOut aria-hidden="true" className="size-5 shrink-0" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
