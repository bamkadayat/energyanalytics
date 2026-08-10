"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";

/**
 * A bento panel with a cursor spotlight in its own accent.
 *
 * The pointer position is written straight to CSS custom properties rather than held in
 * React state — a mousemove handler that calls setState re-renders the subtree on every
 * pixel, and this effect is pure paint.
 *
 * `focus-within` in the stylesheet covers keyboard users, who a mouse-only effect would
 * exclude. The glow is decoration either way: nothing here is the only signal for
 * anything.
 */
export function SpotlightCard({
  accent,
  featured = false,
  children,
}: {
  /** A colour token name, e.g. `--chart-wind`. */
  accent: string;
  featured?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onPointerMove={(event) => {
        const card = ref.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      style={{ "--spot-color": `var(${accent})` } as CSSProperties}
      className={`bento bento-spot relative flex min-w-0 flex-col gap-5 overflow-hidden p-5 text-fg-inverse ${
        // The flanking cards step back with `.bento-quiet` — a lighter fill, so they
        // carry less contrast against the light page and the featured card holds the row.
        featured ? "" : "bento-quiet "
      }${
        /*
         * The featured card is **bigger**, not moved.
         *
         * A translate was tried first and is the wrong tool: it shifts a card of the same
         * size upward, so the row reads as one card knocked out of line rather than one
         * card given more room. Growing it — more padding here, a taller chart in
         * `metric-highlights` — makes it larger on both edges, and the grid's
         * `lg:items-center` centres the outer two against it.
         *
         * `lg:` only. Stacked, every card is full width and the extra padding would just
         * be one oddly roomy card in a column.
         */
        featured ? "shadow-popover lg:p-8" : ""
      }`}
    >
      {/* Above the ::before glow, which is painted on the panel itself. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">{children}</div>
    </li>
  );
}
