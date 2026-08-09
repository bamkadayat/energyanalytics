import { useMemo, useSyncExternalStore } from "react";

/** Token values never change after load, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/**
 * Reads design tokens off the document root, once there is a document.
 *
 * Every chart needs this: ECharts draws to a canvas, and canvas cannot consume
 * `var(--token)`. Shared so the three charts cannot drift into reading tokens three
 * slightly different ways.
 *
 * `useSyncExternalStore` rather than a `setState` in an effect — this is a browser-only
 * value, not state a component owns. The server snapshot is `false` and the client
 * snapshot `true`, so React resolves it during hydration instead of costing an extra
 * render.
 *
 * `getComputedStyle` resolves `var()` chains, so a token defined as `var(--slate-600)`
 * returns the literal colour. The result can carry leading whitespace, hence the trim —
 * ECharts silently ignores a value like `" #475569"`.
 */
export function useChartTokens<K extends string>(
  names: readonly K[],
): Record<K, string> | null {
  const hasDocument = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );

  // Names are a stable literal at every call site; joining keeps the dependency a
  // primitive rather than a new array identity each render.
  const key = names.join(",");

  return useMemo(() => {
    if (!hasDocument) {
      return null;
    }

    const styles = getComputedStyle(document.documentElement);
    const entries = key
      .split(",")
      .map((name) => [name, styles.getPropertyValue(name).trim()] as const);

    return Object.fromEntries(entries) as Record<K, string>;
  }, [hasDocument, key]);
}
