import { connection } from "next/server";
import { getPriceRange } from "@/features/energy-prices";
import { getWeatherRange } from "@/features/weather-forecast";
import { HOURS_TABLE_DAYS, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";
import { formatCount } from "@/shared/lib/format-number";
import { formatOsloDateShort, formatOsloDateTime } from "@/shared/lib/format-oslo";
import { osloDaysBack } from "@/shared/lib/oslo-day";
import { StatusMessage } from "@/shared/ui";
import { deriveHourRows } from "../utils/derive-hour-rows";
import { HoursTable } from "./hours-table";

/**
 * Every hour of the last ninety days, joined and handed to the table.
 *
 * **All of the work is here, on the server.** Two providers are fetched concurrently —
 * one Open-Meteo request for the whole span, one cached request per price day — joined on
 * a normalised hour, and reduced to a flat array of primitives. The browser receives rows
 * it can sort and filter immediately; it never parses a timestamp or aligns anything.
 *
 * Days whose prices failed are dropped rather than propagated: 89 days of a 90-day table
 * is still a 90-day table with a gap in it, and the count below says how many hours
 * actually carry a price.
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

  const priced = rows.filter((row) => row.price !== null).length;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-fg">
          Every hour, {formatOsloDateShort(days[0])} – {formatOsloDateShort(days[days.length - 1])}
        </h2>

        <p className="text-sm text-fg-muted">
          {formatCount(rows.length)} hours of {PRICE_AREA.label} spot prices and{" "}
          {WEATHER_LOCATION.label} weather, joined on the hour.{" "}
          {formatCount(priced)} carry a price. Sorting and filtering run over the
          whole set; only the rows on screen are drawn.
        </p>
      </div>

      <div className="rounded-card border border-line bg-surface p-4">
        <HoursTable rows={rows} />
      </div>
    </div>
  );
}
