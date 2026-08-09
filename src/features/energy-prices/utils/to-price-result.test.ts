import { describe, expect, it } from "vitest";
import type { FetchJsonOutcome } from "@/shared/lib/fetch-json";
import { toPriceResult } from "./to-price-result";

const validHour = {
  NOK_per_kWh: 1.35311,
  EUR_per_kWh: 0.12329,
  EXR: 10.975,
  time_start: "2026-08-09T00:00:00+02:00",
  time_end: "2026-08-09T01:00:00+02:00",
};

describe("toPriceResult", () => {
  it("maps a valid payload to ok", () => {
    const result = toPriceResult({ ok: true, data: [validHour] });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.prices).toHaveLength(1);
    expect(result.prices[0].nokPerKwh).toBe(1.35311);
    expect(result.droppedEntries).toBe(0);
  });

  it("maps a 404 to not-published rather than an error", () => {
    // Verified against the live API: tomorrow's prices return 404 before the day-ahead
    // auction clears. Showing an error page for that would be wrong — the system is
    // working exactly as designed.
    const outcome: FetchJsonOutcome = { ok: false, reason: "not-found", status: 404 };

    expect(toPriceResult(outcome)).toEqual({ status: "not-published" });
  });

  it("maps an empty-but-valid array to not-published too", () => {
    // Same meaning as the 404: the day is acknowledged, there is nothing for it yet.
    // "ok with zero prices" would render an empty chart with no explanation.
    expect(toPriceResult({ ok: true, data: [] })).toEqual({ status: "not-published" });
  });

  it("propagates transport failures as errors", () => {
    const reasons = ["timeout", "network", "provider-error", "invalid-json"] as const;

    for (const reason of reasons) {
      const result = toPriceResult({ ok: false, reason });
      expect(result).toEqual({ status: "error", reason });
    }
  });

  it("maps an unparseable payload to malformed-payload", () => {
    const result = toPriceResult({ ok: true, data: { not: "an array" } });

    expect(result).toEqual({ status: "error", reason: "malformed-payload" });
  });

  it("reports partially bad payloads as ok with a dropped count", () => {
    // Some hours survived, so the day is usable — but the UI needs to know it is
    // incomplete rather than presenting it as a full day.
    const result = toPriceResult({
      ok: true,
      data: [validHour, { ...validHour, NOK_per_kWh: null }],
    });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.prices).toHaveLength(1);
    expect(result.droppedEntries).toBe(1);
  });

  it("treats a payload whose every entry is invalid as not-published, not ok-and-empty", () => {
    const result = toPriceResult({ ok: true, data: [{ NOK_per_kWh: "nope" }] });

    expect(result.status).toBe("not-published");
  });
});
