/**
 * Client-safe surface of the market-correlation feature.
 *
 * `index.ts` re-exports server components and, through them, the `use cache` fetchers.
 * Importing it from a client component drags those into the browser bundle and fails the
 * build — which is exactly what happened when the dashboard rail started importing
 * `hrefWith` from the barrel.
 *
 * This entry carries only the URL contract: pure functions and types with no server
 * dependencies. It exists so client code has somewhere legitimate to import from, rather
 * than deep-importing feature internals (context/architecture.md §2).
 */
export type { SearchParamsInput, ViewMode, ViewParams } from "./utils/view-params";
export {
  hrefWith,
  parseViewParams,
  viewParamsHref,
  VIEW_PARAM_KEYS,
} from "./utils/view-params";
