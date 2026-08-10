import { FiLogOut } from "react-icons/fi";
import { logout } from "@/features/auth";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent } from "./rail-content";

/**
 * The application rail, from `lg` up.
 *
 * Dark against a light work area. That is not decoration: it separates chrome from
 * content without a heavier border, and it carries the same ink the landing page's cards
 * use, so the two halves of the product look like one product.
 *
 * Below `lg` the same filters appear in `MobileNav`'s drawer — both render `RailContent`,
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-surface-rail text-fg-inverse lg:flex">
      <div className="border-b border-line-inverse px-4 py-4">
        <Wordmark tone="inverse" />
      </div>

      <nav
        aria-label="Dashboard filters"
        className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-5"
      >
        <RailContent params={params} />
      </nav>

      {/*
        Pinned to the bottom behind a divider, as in the reference. Logout lives here
        rather than in the header: it is used once a session and does not deserve prime
        space next to the data.
      */}
      <div className="border-t border-line-inverse px-3 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
          >
            <FiLogOut aria-hidden="true" className="size-4 shrink-0" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
