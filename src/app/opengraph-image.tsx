import { ImageResponse } from "next/og";
import { getSettledPrices } from "@/features/energy-prices";
import { PREVIEW_DAY, PRICE_AREA, WEATHER_LOCATION } from "@/shared/config";

/**
 * The link preview card, drawn from the same fixed example day as the hero.
 *
 * The landing page exists to be sent to someone — in an email, a chat, a job
 * application — so the preview card is part of the page, not decoration. It carries real
 * prices for the same reason the hero does: the shape is what actually happened, and a
 * generic gradient would be the one invented number on an otherwise sourced page.
 *
 * `PREVIEW_DAY` is a constant, so nothing here reads the clock and Next can generate this
 * once at build time rather than per request.
 */

export const alt =
  "Nordic Power & Weather Explorer — day-ahead spot prices for NO1 East Norway beside Oslo weather, hour by hour.";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

/**
 * Token values, duplicated as literals.
 *
 * **This is the one place in `src/` allowed to hold colour values**, and it needs a narrow
 * `no-restricted-syntax` exemption in `eslint.config.mjs` to exist. The guard's own
 * rationale does not apply here: it exists because Tailwind's cleared palette makes a bad
 * class fail *silently*, and this file emits no classes at all. Satori rasterises without
 * a stylesheet, so `var(--token)` has nothing to resolve against.
 *
 * The cost is real and worth stating: **these will not follow `globals.css` if the palette
 * changes.** They are mirrored from the foundation scale — see `context/ui-tokens.md`, and
 * re-check them here whenever a colour value moves.
 */
const OG = {
  ground: "#0b1128", // --navy-900, via --surface-inverse
  hairline: "#16204a", // --navy-800, via --line-inverse
  fg: "#ffffff", // --white, via --fg-inverse
  fgMuted: "#c3cae2", // --navy-200, via --fg-inverse-muted
  price: "#2563eb", // --chart-price
} as const;

export default async function OpengraphImage() {
  const prices = await getSettledPrices(PREVIEW_DAY);

  /*
   * Bar heights as percentages, scaled from zero rather than from the day's minimum.
   * Scaling from the minimum exaggerates a flat day into a dramatic one, which is the
   * chart equivalent of a truncated y-axis — not something to do on the image that
   * represents the project.
   */
  const bars =
    prices.status === "ok"
      ? (() => {
          const values = prices.prices.map((price) => price.nokPerKwh);
          const max = Math.max(...values);
          return max > 0 ? values.map((value) => (value / max) * 100) : [];
        })()
      : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: OG.ground,
          color: OG.fg,
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: OG.fgMuted,
            }}
          >
            Nordic Power &amp; Weather
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Power prices and weather, hour by hour
          </div>

          <div style={{ display: "flex", fontSize: 30, color: OG.fgMuted }}>
            {PRICE_AREA.label} · {WEATHER_LOCATION.label} · day-ahead spot prices
          </div>
        </div>

        {/*
          One bar per hour of the example day. Bars rather than a line: Satori lays out
          boxes, and a path would mean shipping geometry it cannot stroke reliably.
        */}
        {bars.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 150,
              borderBottom: `2px solid ${OG.hairline}`,
              paddingBottom: 2,
            }}
          >
            {bars.map((height, hour) => (
              <div
                key={hour}
                style={{
                  display: "flex",
                  flex: 1,
                  height: `${Math.max(height, 2)}%`,
                  background: OG.price,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        ) : (
          /* The provider was unreachable at build time. Say nothing rather than draw
             invented bars — the whole point of the card is that its numbers are real. */
          <div style={{ display: "flex", height: 150 }} />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: OG.fgMuted,
            borderTop: `2px solid ${OG.hairline}`,
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex" }}>
            {PREVIEW_DAY.day}.{PREVIEW_DAY.month}.{PREVIEW_DAY.year} · Europe/Oslo
          </div>
          <div style={{ display: "flex" }}>hvakosterstrommen.no · open-meteo.com</div>
        </div>
      </div>
    ),
    size,
  );
}
