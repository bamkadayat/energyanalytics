import { describe, expect, it } from "vitest";
import { parseHourlyWeather } from "./parse-weather";

/** 2026-08-09T00:00 Europe/Oslo (UTC+2) as epoch seconds. */
const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0) / 1000;

function unixHours(count: number): number[] {
  return Array.from({ length: count }, (_, i) => MIDNIGHT_OSLO + i * 3600);
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    latitude: 59.9139,
    longitude: 10.7522,
    hourly: {
      time: unixHours(3),
      wind_speed_10m: [3.1, 4.2, 5.3],
      temperature_2m: [17.4, 17.9, 18.2],
      shortwave_radiation: [0, 12, 88],
      ...overrides,
    },
  };
}

describe("parseHourlyWeather", () => {
  it("parses a well-formed payload and keeps the columnar layout", () => {
    const result = parseHourlyWeather(payload());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { weather, unavailableMetrics, droppedHours } = result.data;
    expect(unavailableMetrics).toEqual([]);
    expect(droppedHours).toBe(0);
    expect(weather.times).toHaveLength(3);
    expect(weather.times[0].toISOString()).toBe("2026-08-08T22:00:00.000Z");
    expect(weather.values.wind).toEqual([3.1, 4.2, 5.3]);
    expect(weather.values.temperature).toEqual([17.4, 17.9, 18.2]);
    expect(weather.values.solar).toEqual([0, 12, 88]);
  });

  it("keeps every column exactly as long as times", () => {
    const result = parseHourlyWeather(payload());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { times, values } = result.data.weather;
    for (const column of Object.values(values)) {
      expect(column).toHaveLength(times.length);
    }
  });

  it("rejects payloads without a usable hourly block", () => {
    for (const input of [null, undefined, 42, "hourly", {}, { hourly: null }, { hourly: [] }]) {
      const result = parseHourlyWeather(input);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.reason).toBe("malformed-payload");
    }
  });

  it("rejects a payload whose time field is not an array", () => {
    const result = parseHourlyWeather({ hourly: { time: "2026-08-09T00:00" } });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("malformed-payload");
  });

  it("refuses naive timestamps rather than guessing a zone", () => {
    // "2026-08-09T00:00" has no offset. new Date() would read it in the server's local
    // zone, shifting every reading by the deployment region's offset from Europe/Oslo
    // while still looking plausible. Unusable is the honest answer.
    const result = parseHourlyWeather(
      payload({ time: ["2026-08-09T00:00", "2026-08-09T01:00", "2026-08-09T02:00"] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("no-usable-hours");
  });

  it("accepts ISO timestamps that carry an explicit offset", () => {
    const result = parseHourlyWeather(
      payload({
        time: [
          "2026-08-09T00:00:00+02:00",
          "2026-08-09T01:00:00+02:00",
          "2026-08-09T02:00:00Z",
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.weather.times[0].toISOString()).toBe("2026-08-08T22:00:00.000Z");
    expect(result.data.droppedHours).toBe(0);
  });

  it("marks a metric unavailable when its column length does not match time", () => {
    // Truncating instead would pair readings with the wrong hours — position i would no
    // longer mean hour i.
    const result = parseHourlyWeather(payload({ wind_speed_10m: [3.1, 4.2] }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.unavailableMetrics).toEqual(["wind"]);
    expect(result.data.weather.values.wind).toEqual([null, null, null]);
    // The other metrics are unaffected.
    expect(result.data.weather.values.temperature).toEqual([17.4, 17.9, 18.2]);
  });

  it("marks a metric unavailable when the provider omits it entirely", () => {
    const result = parseHourlyWeather(payload({ shortwave_radiation: undefined }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.unavailableMetrics).toEqual(["solar"]);
    expect(result.data.weather.values.solar).toEqual([null, null, null]);
  });

  it("preserves gaps as null instead of coercing them to zero", () => {
    const result = parseHourlyWeather(
      payload({ wind_speed_10m: [null, 4.2, Number.NaN] }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.weather.values.wind).toEqual([null, 4.2, null]);
    // A missing reading and a calm hour must stay distinguishable.
    expect(result.data.unavailableMetrics).toEqual([]);
  });

  it("keeps a genuine zero reading", () => {
    const result = parseHourlyWeather(payload({ shortwave_radiation: [0, 0, 88] }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.weather.values.solar).toEqual([0, 0, 88]);
  });

  it("drops unusable hours and the matching position in every column", () => {
    const result = parseHourlyWeather(
      payload({ time: [MIDNIGHT_OSLO, "not-a-time", MIDNIGHT_OSLO + 7200] }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.droppedHours).toBe(1);
    expect(result.data.weather.times).toHaveLength(2);
    // Index 1 is gone from the readings too, not just from times.
    expect(result.data.weather.values.wind).toEqual([3.1, 5.3]);
    expect(result.data.weather.values.temperature).toEqual([17.4, 18.2]);
  });

  it("sorts out-of-order hours and reorders every column with them", () => {
    const result = parseHourlyWeather(
      payload({ time: [MIDNIGHT_OSLO + 7200, MIDNIGHT_OSLO, MIDNIGHT_OSLO + 3600] }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.weather.times.map((t) => t.toISOString())).toEqual([
      "2026-08-08T22:00:00.000Z",
      "2026-08-08T23:00:00.000Z",
      "2026-08-09T00:00:00.000Z",
    ]);
    // Readings travel with their hour rather than staying at their old position.
    expect(result.data.weather.values.wind).toEqual([4.2, 5.3, 3.1]);
  });

  it("handles the 25-hour DST fall-back day without collapsing the repeated hour", () => {
    // 2026-10-25 Europe/Oslo: 02:00 happens twice, at +02:00 and again at +01:00.
    const start = Date.UTC(2026, 9, 24, 22, 0, 0) / 1000;
    const time = Array.from({ length: 25 }, (_, i) => start + i * 3600);

    const result = parseHourlyWeather({
      hourly: {
        time,
        wind_speed_10m: time.map((_, i) => i),
        temperature_2m: time.map(() => 8),
        shortwave_radiation: time.map(() => 0),
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.weather.times).toHaveLength(25);
    expect(result.data.weather.values.wind).toHaveLength(25);
    // Both 02:00 instants survive as distinct hours.
    expect(result.data.weather.times[3].toISOString()).toBe("2026-10-25T01:00:00.000Z");
    expect(result.data.weather.times[4].toISOString()).toBe("2026-10-25T02:00:00.000Z");
  });
});
