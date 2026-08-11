import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * These cover the cookie *write* attributes, which is where logout was broken.
 *
 * `session-token.test.ts` already proves the token itself — signing, expiry, constant-time
 * comparison. None of that helps if the cookie carrying it is never removed, which is
 * exactly what happened: `cookies().delete(name)` emits a `Set-Cookie` with no `Secure`
 * attribute, and a `__Host-` prefixed cookie must carry `Secure` or the browser rejects
 * the header outright. Production sessions therefore survived logout. Development did not
 * show it, because the cookie name is unprefixed there.
 */

const store = {
  set: vi.fn(),
  get: vi.fn(() => undefined),
  delete: vi.fn(),
};

/*
 * `server-only` resolves to a module that throws unless the `react-server` condition is
 * set, which Vitest does not set. Stubbing it is the standard way to exercise a server
 * module directly; the guard it provides is a build-time one and still applies to the app.
 */
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => store }));
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("@/shared/config/server", () => ({
  getAuthSecret: () => "a".repeat(32),
  getDashboardPassword: () => "correct-horse",
  getDemoPasswordHint: () => null,
}));

const { createSession, destroySession, SESSION_COOKIE } = await import("./session");

/** The attributes a browser matches on, plus the ones `__Host-` makes mandatory. */
const SECURITY_ATTRIBUTES = ["httpOnly", "secure", "sameSite", "path"] as const;

function optionsPassedToSet() {
  const call = store.set.mock.calls.at(-1);
  if (!call) throw new Error("cookies().set was never called");
  return { name: call[0] as string, value: call[1] as string, options: call[2] };
}

describe("session cookie", () => {
  beforeEach(() => {
    store.set.mockClear();
    store.delete.mockClear();
  });

  it("clears the session by overwriting it, never by delete()", async () => {
    // `delete()` drops every attribute but `path`. For a `__Host-` name that is a
    // Set-Cookie the browser refuses, so the session would outlive logout.
    await destroySession();

    expect(store.delete).not.toHaveBeenCalled();
    expect(store.set).toHaveBeenCalledOnce();
  });

  it("expires the cleared cookie in the past", async () => {
    await destroySession();
    const { value, options } = optionsPassedToSet();

    expect(value).toBe("");
    expect(options.expires.getTime()).toBeLessThanOrEqual(0);
    expect(options.maxAge).toBe(0);
  });

  it("clears with the same security attributes it was written with", async () => {
    // The heart of it: a removal that does not match is not a removal.
    await createSession(1_700_000_000_000);
    const created = optionsPassedToSet();

    store.set.mockClear();
    await destroySession();
    const cleared = optionsPassedToSet();

    expect(cleared.name).toBe(created.name);
    for (const attribute of SECURITY_ATTRIBUTES) {
      expect(cleared.options[attribute]).toBe(created.options[attribute]);
    }
  });

  it("keeps the attributes `__Host-` requires", async () => {
    // `path` must be exactly "/" and `secure` must be set for the prefix to be accepted.
    // `secure` follows NODE_ENV, which is what pairs it with the prefixed name.
    for (const write of [createSession, destroySession]) {
      store.set.mockClear();
      await write();
      const { options } = optionsPassedToSet();

      expect(options.path).toBe("/");
      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(process.env.NODE_ENV === "production");
    }
  });

  it("pairs the `__Host-` prefix with `secure`, so the two cannot drift apart", () => {
    // A prefixed name written without Secure is rejected by the browser; an unprefixed
    // name marked Secure cannot be set over plain HTTP in development. Either mismatch
    // breaks sign-in silently, so they are asserted to move together.
    expect(SESSION_COOKIE.startsWith("__Host-")).toBe(
      process.env.NODE_ENV === "production",
    );
  });
});
