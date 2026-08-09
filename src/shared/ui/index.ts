/**
 * Presentational primitives. Domain-agnostic by rule: nothing here may know about
 * prices, weather, or Oslo (context/architecture.md §2).
 */
export { StatusMessage } from "./status-message";
export type { StatusMessageProps, StatusTone } from "./status-message";
