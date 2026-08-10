import { FiLogOut } from "react-icons/fi";
import { logout } from "@/features/auth";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent } from "./rail-content";

/**
 * The application rail, from `lg` up.
 *
 * Below that the same filters appear in `MobileNav`'s drawer — both render `RailContent`,
 * so a phone can never show a different set of filters from the desktop.
 *
 * Every entry is a real filter or a real anchor. A rail of links to pages that do not
 * exist would look like a dashboard and behave like a mock-up.
 *
 * There is deliberately no search field: this app has one dataset and nothing to search,
 * and a box that accepts typing and does nothing is a worse lie than an absent feature.
 */
export function DashboardSidebar({ params }: { params: ViewParams }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="px-4 py-4">
        <Wordmark />
      </div>

      <nav
        aria-label="Dashboard filters"
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4"
      >
        <RailContent params={params} />
      </nav>

      {/*
        Pinned to the bottom behind a divider, as in the reference. Logout lives here
        rather than in the header: it is used once a session and does not deserve prime
        space next to the data.
      */}
      <div className="border-t border-line px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle hover:text-fg"
          >
            <FiLogOut aria-hidden="true" className="size-5 shrink-0" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
