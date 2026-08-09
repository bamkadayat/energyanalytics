import { describe, expect, it } from "vitest";
import { parseEnergyPrices } from "./parse-prices";

function rawHour(
  hour: number,
  nokPerKwh: number,
  offset = "+02:00",
): Record<string, unknown> {
  const pad = String(hour).padStart(2, "0");
  const nextPad = String(hour + 1).padStart(2, "0");
  return {
    NOK_per_kWh: nokPerKwh,
    EUR_per_kWh: nokPerKwh / 11.5,
    EXR: 11.5,
    time_start: `2026-08-09T${pad}:00:00${offset}`,
    time_end: `2026-08-09T${nextPad}:00:00${offset}`,
  };
}

describe("parseEnergyPrices", () => {
  it("parses a well-formed payload and keeps only the fields the UI renders", () => {
    const result = parseEnergyPrices([rawHour(0, 0.42), rawHour(1, 0.51)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.droppedEntries).toBe(0);
    expect(result.data.prices).toHaveLength(2);
    expect(result.data.prices[0]).toEqual({
      hourStart: new Date("2026-08-09T00:00:00+02:00"),
      hourEnd: new Date("2026-08-09T01:00:00+02:00"),
      nokPerKwh: 0.42,
    });
    // EUR and the exchange rate are dropped at the boundary, not shipped to the client.
    expect(result.data.prices[0]).not.toHaveProperty("EUR_per_kWh");
  });

  it("rejects a payload that is not an array", () => {
    for (const input of [null, undefined, {}, "prices", 42]) {
      const result = parseEnergyPrices(input);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.reason).toBe("malformed-payload");
    }
  });

  it("treats an empty array as a successful parse, not an error", () => {
    // This is what the provider returns for tomorrow before prices are published.
    // Collapsing it into an error would make that state indistinguishable from a
    // broken payload.
    const result = parseEnergyPrices([]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.prices).toEqual([]);
    expect(result.data.droppedEntries).toBe(0);
  });

  it("keeps a legitimate zero price", () => {
    const result = parseEnergyPrices([rawHour(0, 0)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.prices).toHaveLength(1);
    expect(result.data.prices[0].nokPerKwh).toBe(0);
  });

  it("keeps negative prices, which occur in the Nordic market", () => {
    const result = parseEnergyPrices([rawHour(0, -0.013)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.prices[0].nokPerKwh).toBe(-0.013);
  });

  it("drops entries with a missing or non-numeric price instead of coercing to zero", () => {
    const result = parseEnergyPrices([
      { ...rawHour(0, 0.42), NOK_per_kWh: null },
      { ...rawHour(1, 0.42), NOK_per_kWh: "0.51" },
      { ...rawHour(2, 0.42), NOK_per_kWh: Number.NaN },
      { ...rawHour(3, 0.42), NOK_per_kWh: undefined },
      rawHour(4, 0.63),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.droppedEntries).toBe(4);
    expect(result.data.prices).toHaveLength(1);
    expect(result.data.prices[0].nokPerKwh).toBe(0.63);
    // The crucial part: no dropped hour reappears as a zero.
    expect(result.data.prices.some((p) => p.nokPerKwh === 0)).toBe(false);
  });

  it("drops entries with unparseable or missing timestamps", () => {
    const result = parseEnergyPrices([
      { ...rawHour(0, 0.42), time_start: "not-a-date" },
      { ...rawHour(1, 0.42), time_start: "" },
      { ...rawHour(2, 0.42), time_end: undefined },
      rawHour(3, 0.42),
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.droppedEntries).toBe(3);
    expect(result.data.prices).toHaveLength(1);
  });

  it("drops entries whose hour ends before it starts", () => {
    const result = parseEnergyPrices([
      {
        ...rawHour(5, 0.42),
        time_start: "2026-08-09T05:00:00+02:00",
        time_end: "2026-08-09T04:00:00+02:00",
      },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.prices).toHaveLength(0);
    expect(result.data.droppedEntries).toBe(1);
  });

  it("drops non-object entries", () => {
    const result = parseEnergyPrices([null, "0.42", 42, [], rawHour(0, 0.42)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.droppedEntries).toBe(4);
    expect(result.data.prices).toHaveLength(1);
  });

  it("sorts out-of-order entries ascending by hour", () => {
    const result = parseEnergyPrices([rawHour(5, 0.5), rawHour(0, 0.1), rawHour(3, 0.3)]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.prices.map((p) => p.nokPerKwh)).toEqual([0.1, 0.3, 0.5]);
  });

  it("preserves all 25 hours of a DST fall-back day", () => {
    // 2026-10-25 is the Europe/Oslo autumn transition: 02:00 occurs twice, once at
    // +02:00 and once at +01:00. Both are distinct instants and both must survive.
    const dstDay = [
      { NOK_per_kWh: 0.2, time_start: "2026-10-25T02:00:00+02:00", time_end: "2026-10-25T03:00:00+02:00" },
      { NOK_per_kWh: 0.3, time_start: "2026-10-25T02:00:00+01:00", time_end: "2026-10-25T03:00:00+01:00" },
    ];

    const result = parseEnergyPrices(dstDay);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.prices).toHaveLength(2);
    expect(result.data.prices[0].hourStart.toISOString()).toBe("2026-10-25T00:00:00.000Z");
    expect(result.data.prices[1].hourStart.toISOString()).toBe("2026-10-25T01:00:00.000Z");
  });
});
