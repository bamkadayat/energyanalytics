import { connection } from "next/server";
import { getPriceRange } from "@/features/energy-prices";
import { getWeatherRange } from "@/features/weather-forecast";
import { HOURS_TABLE_DAYS } from "@/shared/config";
import { formatOsloDateShort, formatOsloDateTime } from "@/shared/lib/format-oslo";
import { osloDaysBack } from "@/shared/lib/oslo-day";
import { StatusMessage } from "@/shared/ui";
import { deriveHourRows } from "../utils/derive-hour-rows";
import { HoursTable } from "./hours-table";

/**
 * Every hour of the last ninety days, joined on the server and handed to the table as
 * flat primitives — the browser never parses a timestamp or aligns anything.
 *
 * Days whose prices failed are dropped, not propagated; the count below says how many
 * hours actually carry a price.
 */
export async function HoursView() {
  await connection();

  const days = osloDaysBack(new Date(), HOURS_TABLE_DAYS);

  const [priceResults, weather] = await Promise.all([
    getPriceRange(days),
    getWeatherRange(days[0], days[days.length - 1]),
  ]);

  const prices = priceResults.flatMap((result) =>
    result.status === "ok" ? result.prices : [],
  );

  const rows = deriveHourRows(
    prices,
    weather.status === "ok" ? weather.weather : null,
    formatOsloDateTime,
  );

  if (rows.length === 0) {
    return (
      <StatusMessage tone="neutral" title="No hours to show">
        Neither provider returned any hours for the last {HOURS_TABLE_DAYS} days.
      </StatusMessage>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/*
        The heading alone (2026-08-14, on request). The paragraph under it stated the row
        count, the area and location, how many hours carried a price, and that sorting
        runs over the whole set.

        Nothing required went with it: `data-note.tsx` in the header carries both
        disclosures `ui-rules.md` mandates — Oslo as a representative location within NO1,
        and prices excluding VAT and grid charges — and the table states its own
        `1–100 of 2,160 hours` in an `aria-live` region.
      */}
      <h2 className="text-lg font-semibold text-fg">
        Every hour, {formatOsloDateShort(days[0])} – {formatOsloDateShort(days[days.length - 1])}
      </h2>

      <div className="rounded-card border border-line bg-surface p-4">
        <HoursTable rows={rows} />
      </div>
    </div>
  );
}
