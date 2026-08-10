import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import type { HourRecord } from "../utils/derive-hour-rows";
import { HoursTable } from "./hours-table";

/**
 * jsdom has no layout: every element measures zero, so a virtualizer would decide nothing
 * is visible and render an empty table. These stubs give it the two numbers it actually
 * reads — the scroll container's height and a row's height — so the component under test
 * behaves the way it does in a browser.
 */
const SCROLLER_HEIGHT = 640;
const ROW_HEIGHT = 40;

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

  /*
   * `offsetHeight`, specifically: TanStack Virtual measures the scroll container with
   * `offsetWidth`/`offsetHeight`, and jsdom answers 0 for both. Without these the
   * virtualizer concludes the viewport is zero pixels tall and renders nothing, which
   * looks exactly like a broken component.
   */
  const sizeFor = (element: HTMLElement) =>
    element.tagName === "TR" ? ROW_HEIGHT : SCROLLER_HEIGHT;

  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return sizeFor(this);
    },
  });

  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 900,
  });

  HTMLElement.prototype.getBoundingClientRect = function measured(this: HTMLElement) {
    const height = sizeFor(this);

    return {
      width: 900,
      height,
      top: 0,
      left: 0,
      right: 900,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
  };
});

/** 300 hours, ascending, with a price that climbs so sort order is unambiguous. */
function hours(count: number): HourRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    at: Date.UTC(2026, 4, 1) + index * 3_600_000,
    label: `row-${String(index).padStart(3, "0")}`,
    price: index === 7 ? null : index / 100,
    temperature: index % 30,
    wind: index % 12,
    solar: index % 500,
  }));
}

const bodyRows = () => document.querySelectorAll("tbody tr");

describe("HoursTable", () => {
  it("mounts a screenful of rows, not the whole page", async () => {
    render(<HoursTable rows={hours(300)} />);

    // The page holds 100 rows; only the window plus overscan is in the DOM. The exact
    // number depends on the overscan, so the assertion is on the order of magnitude.
    expect(bodyRows().length).toBeGreaterThan(5);
    expect(bodyRows().length).toBeLessThan(60);
  });

  it("tells assistive technology the real row count and position", () => {
    render(<HoursTable rows={hours(300)} />);

    // Virtualization hides the rows from the DOM, so the numbers have to be stated.
    expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", "300");
    expect(bodyRows()[0]).toHaveAttribute("aria-rowindex", "1");
  });

  it("paginates the whole set", () => {
    render(<HoursTable rows={hours(300)} />);

    expect(screen.getByText(/1–100 of 300 hours/)).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it("filters over every row, not just the page", async () => {
    const user = userEvent.setup();
    render(<HoursTable rows={hours(300)} />);

    // row-250 is on the last page. A filter that only searched the visible page could
    // not find it, which is the bug this asserts against.
    await user.type(screen.getByRole("searchbox", { name: /find an hour/i }), "row-250");

    expect(screen.getByText(/1–1 of 1 hours/)).toBeInTheDocument();
    expect(within(bodyRows()[0] as HTMLElement).getByText("row-250")).toBeInTheDocument();
  });

  it("sorts over every row, not just the page", async () => {
    const user = userEvent.setup();
    render(<HoursTable rows={hours(300)} />);

    await user.click(screen.getByRole("button", { name: /spot price/i }));

    // Descending first: the dearest hour in the whole set is row-299, which starts on
    // the last page. Sorting a single page would leave row-099 at the top.
    expect(within(bodyRows()[0] as HTMLElement).getByText("row-299")).toBeInTheDocument();
  });

  it("keeps hours without a price out of the set when asked", async () => {
    const user = userEvent.setup();
    render(<HoursTable rows={hours(300)} />);

    await user.click(screen.getByRole("checkbox", { name: /only hours with a price/i }));

    // One of the 300 has no price, and a missing price is not a cheap hour.
    expect(screen.getByText(/1–100 of 299 hours/)).toBeInTheDocument();
  });

  it("sorts hours without a reading to the end, in both directions", async () => {
    /*
     * The regression this guards: `sortUndefined` only recognises `undefined`, so with
     * `null` in the rows a gap fell through to the default comparator and behaved as
     * zero — landing between a freezing hour and a mild one, and above a negative price.
     * Both columns are chosen because both really do go negative here.
     */
    const user = userEvent.setup();
    render(
      <HoursTable
        rows={[
          { at: 1, label: "warm", price: 2, temperature: 12, wind: 1, solar: 1 },
          { at: 2, label: "gap", price: null, temperature: null, wind: null, solar: null },
          { at: 3, label: "freezing", price: -1, temperature: -8, wind: 1, solar: 1 },
          { at: 4, label: "mild", price: 1, temperature: 4, wind: 1, solar: 1 },
        ]}
      />,
    );

    const labels = () => [...bodyRows()].map((row) => row.querySelector("th")?.textContent);

    for (const name of [/temperature/i, /spot price/i]) {
      const header = screen.getByRole("button", { name });

      await user.click(header);
      expect(labels().at(-1)).toBe("gap");

      await user.click(header);
      expect(labels().at(-1)).toBe("gap");
    }
  });
});
