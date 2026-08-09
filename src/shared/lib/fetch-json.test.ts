import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "./fetch-json";

const URL_UNDER_TEST = "https://example.test/data.json";

function mockFetch(implementation: () => Promise<Response> | Response) {
  // Typed as `fetch` so mock.calls carries the real argument tuple.
  const spy = vi.fn<typeof fetch>(async () => implementation());
  vi.stubGlobal("fetch", spy);
  return spy;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns parsed data on success", async () => {
    mockFetch(() => jsonResponse([{ NOK_per_kWh: 1.35 }]));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.data).toEqual([{ NOK_per_kWh: 1.35 }]);
  });

  it("reports 404 as not-found, distinctly from a provider error", async () => {
    // The price API answers 404 for a day that has not been published yet — a normal
    // state with its own UI and cache lifetime, not a failure.
    mockFetch(() => new Response("<p>404: Data not found or not ready yet</p>", { status: 404 }));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("not-found");
    expect(outcome.status).toBe(404);
  });

  it("does not try to parse the body of a 404", async () => {
    // The real 404 body is HTML. Parsing it would throw and mask the actual reason.
    mockFetch(() => new Response("<p>404: Data not found or not ready yet</p>", { status: 404 }));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).not.toBe("invalid-json");
  });

  it("reports other error statuses as provider-error, keeping the status", async () => {
    for (const status of [400, 429, 500, 503]) {
      mockFetch(() => new Response("upstream failed", { status }));

      const outcome = await fetchJson(URL_UNDER_TEST);

      expect(outcome.ok).toBe(false);
      if (outcome.ok) continue;
      expect(outcome.reason).toBe("provider-error");
      expect(outcome.status).toBe(status);
    }
  });

  it("reports a 200 with a non-JSON body as invalid-json", async () => {
    // A success status carrying an error page or captive-portal response.
    mockFetch(() => new Response("<html>not json</html>", { status: 200 }));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("invalid-json");
    expect(outcome.status).toBe(200);
  });

  it("reports a timeout distinctly from a network failure", async () => {
    mockFetch(() => Promise.reject(namedError("TimeoutError")));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("timeout");
  });

  it("treats an aborted request as a timeout", async () => {
    mockFetch(() => Promise.reject(namedError("AbortError")));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("timeout");
  });

  it("reports connection failures as network", async () => {
    mockFetch(() => Promise.reject(new TypeError("fetch failed")));

    const outcome = await fetchJson(URL_UNDER_TEST);

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("network");
  });

  it("never throws, whatever the provider does", async () => {
    const failures = [
      () => Promise.reject(new Error("boom")),
      () => new Response("nope", { status: 500 }),
      () => new Response("<html>", { status: 200 }),
    ];

    for (const failure of failures) {
      mockFetch(failure);
      await expect(fetchJson(URL_UNDER_TEST)).resolves.toBeDefined();
    }
  });

  it("passes an abort signal so a slow provider cannot hang the render", async () => {
    const spy = mockFetch(() => jsonResponse({}));

    await fetchJson(URL_UNDER_TEST, 1234);

    const [, init] = spy.mock.calls[0];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.headers).toMatchObject({ accept: "application/json" });
  });
});
