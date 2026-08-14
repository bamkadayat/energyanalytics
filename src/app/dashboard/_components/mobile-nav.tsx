"use client";

import Link from "next/link";
import { useRef } from "react";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { logout } from "@/features/auth";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent, type RailContentProps } from "./rail-content";

/**
 * The rail as a drawer, below `lg`. Native `<dialog>` + `showModal()`, so focus trapping,
 * Escape and an inert background come free. Link clicks close it by delegation.
 */
export function MobileNav({
  params,
  active,
}: {
  params: ViewParams;
  active?: RailContentProps["active"];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Open menu"
        className="flex size-9 items-center justify-center rounded-control border border-line text-fg-secondary hover:bg-surface-subtle lg:hidden"
      >
        <FiMenu aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Dashboard menu"
        /*
         * `<dialog>` centres itself by default; these reset it to a full-height panel
         * pinned left. `backdrop:` styles the ::backdrop pseudo-element.
         */
        // `drawer` carries the slide-in; see globals.css for why it needs @starting-style.
        // Dark, like the rail it stands in for — the same navigation, not a second one.
        className="drawer m-0 h-full max-h-full w-72 max-w-[85vw] bg-surface-rail p-0 text-fg-inverse lg:hidden"
        onClick={(event) => {
          // Clicking the backdrop resolves to the dialog itself, never a child.
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line-inverse px-4 py-3">
            {/* Home, same as the rail's — the drawer is not a lesser copy of it. */}
            <Link
              href="/dashboard"
              scroll={false}
              onClick={() => dialogRef.current?.close()}
              className="-mx-2 flex min-w-0 rounded-control px-2 py-1 hover:bg-surface-rail-active focus-visible:outline-fg-inverse"
            >
              <Wordmark tone="inverse" short />
            </Link>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close menu"
              className="flex size-9 items-center justify-center rounded-control text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
            >
              <FiX aria-hidden="true" className="size-5" />
            </button>
          </div>

          {/* Any link inside navigates, so close the drawer behind it. */}
          <nav
            /*
             * "Dashboard", not "Dashboard menu" — the `<dialog>` wrapping this already
             * carries that name, and repeating it makes a screen reader announce the same
             * words twice on the way in. Matches the desktop rail's nav, which is the same
             * content at a wider viewport.
             */
            aria-label="Dashboard"
            className="flex flex-1 flex-col gap-7 overflow-y-auto p-3"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                dialogRef.current?.close();
              }
            }}
          >
            <RailContent params={params} active={active} />
          </nav>

          {/*
            Logout sits in the menu here, as it does in the desktop rail, rather than
            competing for space in a phone header.
          */}
          <div className="border-t border-line-inverse p-3">
            <form action={logout}>
              {/* Same treatment as the rail's, so the drawer is not a quieter copy. */}
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-fg-inverse hover:bg-surface-rail-active"
              >
                <FiLogOut aria-hidden="true" className="size-5 shrink-0" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
