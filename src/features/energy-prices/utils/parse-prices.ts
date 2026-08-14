import type {
  EnergyPrice,
  ParsePricesResult,
  RawEnergyPrice,
} from "../types";

/**
 * The only place raw provider data becomes domain data. Invalid entries are dropped and
 * counted, never repaired — a zero price and an absent price draw the same and mean
 * opposite things.
 */
export function parseEnergyPrices(input: unknown): ParsePricesResult {
  if (!Array.isArray(input)) {
    return { ok: false, reason: "malformed-payload" };
  }

  const prices: EnergyPrice[] = [];
  let droppedEntries = 0;

  for (const entry of input) {
    const price = toEnergyPrice(entry);
    if (price === null) {
      droppedEntries += 1;
      continue;
    }
    prices.push(price);
  }

  prices.sort((a, b) => a.hourStart.getTime() - b.hourStart.getTime());

  return { ok: true, data: { prices, droppedEntries } };
}

function toEnergyPrice(entry: unknown): EnergyPrice | null {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const candidate = entry as Partial<RawEnergyPrice>;

  // A price of 0 is legitimate — Nordic spot prices do reach zero and go negative — so
  // this checks the type, not the truthiness.
  const nokPerKwh = candidate.NOK_per_kWh;
  if (typeof nokPerKwh !== "number" || !Number.isFinite(nokPerKwh)) {
    return null;
  }

  const hourStart = toDate(candidate.time_start);
  const hourEnd = toDate(candidate.time_end);
  if (hourStart === null || hourEnd === null) {
    return null;
  }

  // An hour that ends before it starts means the payload is internally inconsistent;
  // charting it would produce a silently wrong axis.
  if (hourEnd.getTime() <= hourStart.getTime()) {
    return null;
  }

  return { hourStart, hourEnd, nokPerKwh };
}

/**
 * Provider timestamps carry an explicit UTC offset (e.g. "2026-08-09T00:00:00+02:00"),
 * so they parse to unambiguous instants. Zone-aware presentation happens later, against
 * APP_TIME_ZONE — never against the server's local zone.
 */
function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
