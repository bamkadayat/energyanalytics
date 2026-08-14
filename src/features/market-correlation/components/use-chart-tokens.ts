import { useMemo, useSyncExternalStore } from "react";

/** Token values never change after load, so there is nothing to subscribe to. */
const noSubscription = () => () => {};

/**
 * Reads design tokens off the document root — a canvas cannot consume `var(--token)`.
 * `useSyncExternalStore` over an effect, so React resolves it during hydration. The trim
 * matters: ECharts silently ignores a value like `" #475569"`.
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
