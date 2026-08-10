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
        /*
         * The featured card is lifted, and given depth to match.
         *
         * An earlier version emphasised the *default metric* — the first of the three —
         * and could only use depth: lifting the leftmost card made the row's top edge
         * look misaligned rather than emphasised. Raising the **middle** one has the
         * opposite effect, because the two beside it are symmetrical about it.
         *
         * `translate` rather than a margin, so the lift costs no layout: the grid row is
         * unchanged and the neighbours do not reflow. Only at `lg`, where the three sit
         * side by side — stacked, a raised card is just a stray gap.
         */
        featured ? "shadow-popover lg:-translate-y-6" : ""
      }`}
    >
      {/* Above the ::before glow, which is painted on the panel itself. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">{children}</div>
    </li>
  );
}
