/**
 * Public API of the energy-prices feature.
 *
 * Other features and the app layer import from here and nowhere else — deep imports into
 * this feature's internals are forbidden (context/architecture.md §2). Keep this barrel
 * deliberate: the domain contract, not a re-export of everything.
 *
 * `RawEnergyPrice` is intentionally absent. The raw provider shape never leaves the
 * feature; only validated domain data crosses this boundary.
 */
export type {
  EnergyPrice,
  ParsedPrices,
  ParsePricesFailure,
  ParsePricesResult,
} from "./types";

export { parseEnergyPrices } from "./utils/parse-prices";
