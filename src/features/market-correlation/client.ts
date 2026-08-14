/**
 * Client-safe surface: the URL contract only, no server dependencies.
 *
 * `index.ts` reaches the `use cache` fetchers, so importing it from a client component
 * fails the build. This gives client code somewhere legitimate to import from.
 */
export type { SearchParamsInput, ViewMode, ViewParams } from "./utils/view-params";
export {
  hrefWith,
  parseViewParams,
  viewParamsHref,
  VIEW_PARAM_KEYS,
} from "./utils/view-params";
