import { describe, expect, it } from "vitest";
import { toWeatherResult } from "./to-weather-result";

const MIDNIGHT_OSLO = Date.UTC(2026, 7, 8, 22, 0, 0) / 1000;

const validPayload = {
  hourly: {
    time: [MIDNIGHT_OSLO, MIDNIGHT_OSLO + 3600],
    wind_speed_10m: [3.1, 4.2],
    temperature_2m: [17.4, 17.9],
    shortwave_radiation: [0, 12],
  },
};

describe("toWeatherResult", () => {
  it("maps a valid payload to ok", () => {
    const result = toWeatherResult({ ok: true, data: validPayload });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.weather.times).toHaveLength(2);
    expect(result.weather.values.wind).toEqual([3.1, 4.2]);
    expect(result.unavailableMetrics).toEqual([]);
    expect(result.droppedHours).toBe(0);
  });

  it("treats a 404 as an error, unlike prices", () => {
    // A forecast for a supported day always exists, so its absence means the request or
    // the provider is wrong — not that the data has yet to be produced.
    const result = toWeatherResult({ ok: false, reason: "not-found", status: 404 });

    expect(result).toEqual({ status: "error", reason: "not-found" });
  });

  it("propagates transport failures as errors", () => {
    const reasons = ["timeout", "network", "provider-error", "invalid-json"] as const;

    for (const reason of reasons) {
      expect(toWeatherResult({ ok: false, reason })).toEqual({
        status: "error",
        reason,
      });
    }
  });

  it("maps parser failures through with their own reasons", () => {
    expect(toWeatherResult({ ok: true, data: { nope: true } })).toEqual({
      status: "error",
      reason: "malformed-payload",
    });

    expect(
      toWeatherResult({
        ok: true,
        data: { hourly: { time: ["2026-08-09T00:00"], wind_speed_10m: [3.1] } },
      }),
    ).toEqual({ status: "error", reason: "no-usable-hours" });
  });

  it("reports a partially usable payload as ok, naming the missing metrics", () => {
    // Wind is short, so it cannot be positionally trusted; the other two are fine and
    // the day is still worth showing.
    const result = toWeatherResult({
      ok: true,
      data: { hourly: { ...validPayload.hourly, wind_speed_10m: [3.1] } },
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.unavailableMetrics).toEqual(["wind"]);
    expect(result.weather.values.temperature).toEqual([17.4, 17.9]);
  });
});
