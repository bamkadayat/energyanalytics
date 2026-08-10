"use client";

import { useRef } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import type { ViewParams } from "@/features/market-correlation/client";
import { Wordmark } from "@/shared/ui";
import { RailContent } from "./rail-content";

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
export function MobileNav({ params }: { params: ViewParams }) {
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
        className="m-0 h-full max-h-full w-72 max-w-[85vw] bg-surface p-0 backdrop:bg-surface-inverse backdrop:opacity-50 lg:hidden"
        onClick={(event) => {
          // Clicking the backdrop resolves to the dialog itself, never a child.
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Wordmark />

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close filters"
              className="flex size-9 items-center justify-center rounded-control text-fg-secondary hover:bg-surface-subtle"
            >
              <FiX aria-hidden="true" className="size-5" />
            </button>
          </div>

          {/* Any link inside navigates, so close the drawer behind it. */}
          <nav
            aria-label="Dashboard filters"
            className="flex flex-1 flex-col gap-6 overflow-y-auto p-3"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                dialogRef.current?.close();
              }
            }}
          >
            <RailContent params={params} />
          </nav>
        </div>
      </dialog>
    </>
  );
}
