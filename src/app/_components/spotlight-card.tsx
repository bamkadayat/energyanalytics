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
        // The default metric is raised, so the emphasis means "this is what the dashboard
        // opens on" rather than being an arbitrary favourite. Depth only, no offset: the
        // featured card is the first of the three, and lifting it left the row's top edge
        // looking misaligned rather than emphasised.
        featured ? "shadow-popover" : ""
      }`}
    >
      {/* Above the ::before glow, which is painted on the panel itself. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">{children}</div>
    </li>
  );
}
