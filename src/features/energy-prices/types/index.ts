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
 * One validated hour of day-ahead spot price.
 *
 * Deliberately narrower than the raw shape: the interface only ever renders NOK/kWh, so
 * EUR and the exchange rate are dropped at the boundary rather than shipped to the
 * client. `nokPerKwh` carries its unit in the name — this app handles three different
 * units across two axes, and a bare `value` is a latent domain bug.
 *
 * These are day-ahead spot prices. They exclude VAT, grid charges, and other consumer
 * costs, which the UI must state wherever prices appear.
 */
export interface EnergyPrice {
  /** Absolute instant the hour begins. Zone handling belongs to formatting/alignment. */
  hourStart: Date;
  /** Absolute instant the hour ends. */
  hourEnd: Date;
  nokPerKwh: number;
}

/**
 * Outcome of parsing a provider payload.
 *
 * An empty array is a successful parse with zero prices, **not** an error — for tomorrow
 * before publication the provider legitimately returns nothing. Distinguishing "no prices
 * yet" from "the payload was malformed" is the caller's job, and it needs both arms to do
 * it.
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
