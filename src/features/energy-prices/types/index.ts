/**
 * Shape returned by the Hva koster strømmen API, mirrored field-for-field.
 *
 * Untrusted: nothing outside this feature's parser may consume it. Field names are the
 * provider's, including the unconventional casing.
 */
export interface RawEnergyPrice {
  NOK_per_kWh: number;
  EUR_per_kWh: number;
  EXR: number;
  time_start: string;
  time_end: string;
}

/**
 * One validated hour of day-ahead spot price. Narrower than the raw shape — EUR and the
 * exchange rate are dropped at the boundary rather than shipped to the client.
 *
 * Excludes VAT and grid charges, which the UI must state wherever prices appear.
 */
export interface EnergyPrice {
  /** Absolute instant the hour begins. Zone handling belongs to formatting/alignment. */
  hourStart: Date;
  /** Absolute instant the hour ends. */
  hourEnd: Date;
  nokPerKwh: number;
}

/**
 * An empty array is a successful parse with zero prices, not an error — before
 * publication the provider legitimately returns nothing.
 */
export type ParsePricesResult =
  | { ok: true; data: ParsedPrices }
  | { ok: false; reason: ParsePricesFailure };

export interface ParsedPrices {
  /** Valid hours, sorted ascending by `hourStart`. */
  prices: EnergyPrice[];
  /**
   * Entries rejected during validation. Non-zero means the payload was partially bad;
   * surface it as partial data rather than pretending the day is complete.
   */
  droppedEntries: number;
}

export type ParsePricesFailure = "malformed-payload";

/**
 * Outcome of asking the provider for one day's prices.
 *
 * `not-published` is a first-class arm, not an error: before roughly 13:00 Europe/Oslo
 * the provider answers 404 for tomorrow because the day-ahead auction has not cleared.
 * The UI explains that; it does not apologise for a failure that did not happen.
 */
export type PriceFetchResult =
  | { status: "ok"; prices: EnergyPrice[]; droppedEntries: number }
  | { status: "not-published" }
  | { status: "error"; reason: PriceErrorReason };

/** `not-found` is absent — it is expressed as the `not-published` arm above. */
export type PriceErrorReason =
  | "timeout"
  | "network"
  | "provider-error"
  | "invalid-json"
  | "malformed-payload";
