"use client";

import { useEffect, useRef, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";

/**
 * The standing qualifications, behind an info control in the header.
 *
 * They were a full-width banner at the foot of the day view — the weight of an alert for
 * a permanent footnote — but `ui-rules.md` requires them reachable wherever data shows.
 *
 * A button, not hover text: hover is unreachable on a touchscreen. Opens on click, Enter
 * and Space, closes on Escape or a click outside, and reports `aria-expanded`.
 */
export function DataNote() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="data-note-panel"
        className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs text-fg-muted hover:text-fg"
      >
        <FiInfo aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden sm:inline">How to read this</span>
        <span className="sr-only sm:hidden">How to read this</span>
      </button>

      {open ? (
        <div
          id="data-note-panel"
          role="note"
          /*
           * Anchored under the trigger, right-aligned. The width is a comfortable measure
           * or the viewport less its margins — `w-screen` off an inset trigger is a
           * viewport plus that inset, and a scrollbar on every phone.
           */
          className="absolute right-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-4 text-sm leading-relaxed text-fg-secondary shadow-popover"
        >
          {WEATHER_LOCATION.label} weather is shown as a representative location within{" "}
          {PRICE_AREA.code}, not a regional average. Visual relationships are exploratory
          and do not demonstrate causation. Prices exclude VAT, grid charges and other
          consumer costs.
        </div>
      ) : null}
    </div>
  );
}
