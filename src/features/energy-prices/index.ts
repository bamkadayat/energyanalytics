/**
 * Public API of the energy-prices feature. Deep imports are forbidden
 * (context/architecture.md §2), and `RawEnergyPrice` stays inside deliberately.
 *
 * The fetchers are server-only (`use cache`); client components may import only types.
 */
export type {
  EnergyPrice,
  ParsedPrices,
  ParsePricesFailure,
  ParsePricesResult,
  PriceErrorReason,
  PriceFetchResult,
} from "./types";

export { parseEnergyPrices } from "./utils/parse-prices";
export { toPriceResult } from "./utils/to-price-result";
export {
  getPrices,
  getPendingPrices,
  getPriceRange,
  getSettledPrices,
} from "./api/get-prices";
