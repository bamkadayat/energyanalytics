import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ViewParams } from "@/features/market-correlation/client";
import { RAIL_VIEW_COUNT, RailContent } from "./rail-content";
import { RailSkeleton } from "./shell-skeleton";

/**
 * The skeleton shell is a hand-copy of the real one — unavoidably, because `loading.tsx`
 * receives no `searchParams` and the rail and header both read them. A copy drifts, and
 * this one had: it was missing the rail's logout footer and the nav's `flex-1`, so the
 * foot of the rail arrived somewhere it had not been reserved.
 *
 * These compare the copy against the original on the things that move the layout.
 */

vi.mock("@/features/auth", () => ({ logout: vi.fn() }));

const PARAMS: ViewParams = { day: "today", metric: "wind", range: 30 } as ViewParams;

/** Rows are the interactive entries: one per metric, one per view. */
function railRowCount(container: HTMLElement) {
  return container.querySelectorAll("a").length;
}

describe("rail skeleton", () => {
  it("reserves one row per real rail entry", () => {
    // The count used to be the literal `[3, 3]`. A fourth weather metric would have left
    // the skeleton a row short, and nothing would have said so.
    const real = render(<RailContent params={PARAMS} />);
    const skeleton = render(<RailSkeleton />);

    // Scoped to the nav area, so the brand block and the logout row are not counted as
    // filter entries.
    const reserved =
      skeleton.container.querySelector(".flex-1")?.querySelectorAll(".h-9").length ?? 0;

    expect(railRowCount(real.container)).toBeGreaterThan(0);
    expect(reserved).toBe(railRowCount(real.container));
  });

  it("reserves the shorter rail on /dashboard/hours", () => {
    // The metric group is not drawn there — the hours table shows all three metrics as
    // columns and ignores `params.metric`. Reserving it anyway would resolve into a
    // visibly shorter rail, which is the drift the test above exists to catch.
    const real = render(<RailContent params={PARAMS} active="hours" />);
    const skeleton = render(<RailSkeleton active="hours" />);

    const reserved =
      skeleton.container.querySelector(".flex-1")?.querySelectorAll(".h-9").length ?? 0;

    expect(railRowCount(real.container)).toBe(RAIL_VIEW_COUNT);
    expect(reserved).toBe(railRowCount(real.container));
  });

  it("reserves the logout row at the foot", () => {
    // Present in both real rails and in neither skeleton before this.
    const { container } = render(<RailSkeleton />);
    const foot = container.querySelector(".border-t");

    expect(foot).not.toBeNull();
    expect(foot?.querySelector(".h-9")).not.toBeNull();
  });

  it("lets the nav grow, so the foot sits at the bottom", () => {
    // Without `flex-1` nothing pushes the logout block down, and it resolves from the
    // middle of the rail to the bottom of it.
    const { container } = render(<RailSkeleton />);

    expect(container.querySelector(".flex-1")).not.toBeNull();
  });

  it("matches the real rail's own geometry", () => {
    const { container } = render(<RailSkeleton />);
    const aside = container.querySelector("aside");

    // Same width, height and breakpoint as `DashboardSidebar`; a different one would
    // reflow the whole work area on arrival.
    for (const className of ["w-60", "h-screen", "sticky", "lg:flex", "bg-surface-rail"]) {
      expect(aside?.classList.contains(className)).toBe(true);
    }
  });

  it("is hidden from assistive technology", () => {
    // The pending region owns the one announcement; the shell must not add noise.
    const { container } = render(<RailSkeleton />);

    expect(container.querySelector("aside")?.getAttribute("aria-hidden")).toBe("true");
  });
});
