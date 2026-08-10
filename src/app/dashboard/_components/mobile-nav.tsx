"use client";

import { useRef } from "react";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { logout } from "@/features/auth";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent, type RailContentProps } from "./rail-content";

/**
 * The rail as an off-canvas drawer, below `lg`.
 *
 * Built on the native `<dialog>` element with `showModal()`, which gives focus trapping,
 * Escape-to-close, and inert background content for free. Hand-rolling those is where
 * custom drawers usually go wrong — a focus trap that leaks is invisible to the author
 * and immediately obvious to a keyboard user.
 *
 * Closing on link click is delegated rather than threaded through every link: the drawer
 * navigates client-side, so without it the panel would stay open over the page you just
 * asked for.
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
        aria-label="Open filters"
        className="flex size-9 items-center justify-center rounded-control border border-line text-fg-secondary hover:bg-surface-subtle lg:hidden"
      >
        <FiMenu aria-hidden="true" className="size-5" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Dashboard filters"
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
            <Wordmark tone="inverse" />

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close filters"
              className="flex size-9 items-center justify-center rounded-control text-fg-inverse-muted hover:bg-surface-rail-active hover:text-fg-inverse"
            >
              <FiX aria-hidden="true" className="size-5" />
            </button>
          </div>

          {/* Any link inside navigates, so close the drawer behind it. */}
          <nav
            aria-label="Dashboard filters"
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
            Logout sits with the filters here, as it does in the desktop rail, rather than
            competing for space in a phone header.
          */}
          <div className="border-t border-line-inverse p-3">
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
        </div>
      </dialog>
    </>
  );
}
