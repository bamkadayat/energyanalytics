import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  isCorrectPassword,
  isValidSessionToken,
  SESSION_DURATION_MS,
} from "./session-token";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const OTHER_SECRET = "a-different-secret-also-32-characters-long!!";
const NOW = Date.UTC(2026, 7, 9, 12, 0, 0);
const EXPIRES = NOW + SESSION_DURATION_MS;

describe("session tokens", () => {
  it("accepts a token it just issued", () => {
    const token = createSessionToken(SECRET, EXPIRES);

    expect(isValidSessionToken(SECRET, token, NOW)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    // Rotating AUTH_SECRET is the intended way to invalidate every session at once.
    const token = createSessionToken(OTHER_SECRET, EXPIRES);

    expect(isValidSessionToken(SECRET, token, NOW)).toBe(false);
  });

  it("rejects a token whose expiry has passed", () => {
    const token = createSessionToken(SECRET, NOW + 1000);

    expect(isValidSessionToken(SECRET, token, NOW + 2000)).toBe(false);
  });

  it("rejects a token that expires exactly now", () => {
    const token = createSessionToken(SECRET, NOW);

    expect(isValidSessionToken(SECRET, token, NOW)).toBe(false);
  });

  it("rejects an extended expiry carrying the original signature", () => {
    // The whole point of signing: the payload is only an expiry, so lengthening it is
    // the one attack worth attempting.
    const token = createSessionToken(SECRET, EXPIRES);
    const signature = token.slice(token.indexOf(".") + 1);
    const forged = `${EXPIRES + 86_400_000}.${signature}`;

    expect(isValidSessionToken(SECRET, forged, NOW)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken(SECRET, EXPIRES);
    const tampered = `${token.slice(0, -1)}${token.endsWith("A") ? "B" : "A"}`;

    expect(isValidSessionToken(SECRET, tampered, NOW)).toBe(false);
  });

  it("rejects malformed input without throwing", () => {
    const malformed = [
      undefined,
      "",
      ".",
      "abc",
      ".signature",
      `${EXPIRES}`,
      `${EXPIRES}.`,
      "-1.sig",
      "1e9.sig",
      " 123.sig",
      "999999999999999999999999.sig",
      `${EXPIRES}.${"x".repeat(1000)}`,
    ];

    for (const token of malformed) {
      expect(() => isValidSessionToken(SECRET, token, NOW)).not.toThrow();
      expect(isValidSessionToken(SECRET, token, NOW)).toBe(false);
    }
  });

  it("produces a different signature for a different expiry", () => {
    const a = createSessionToken(SECRET, EXPIRES);
    const b = createSessionToken(SECRET, EXPIRES + 1000);

    expect(a).not.toBe(b);
  });

  it("carries no identity or user input in the payload", () => {
    // The token is only an expiry and a signature — nothing that could smuggle data
    // into a trusted context.
    const token = createSessionToken(SECRET, EXPIRES);

    expect(token.split(".")).toHaveLength(2);
    expect(token.split(".")[0]).toBe(String(EXPIRES));
  });
});

describe("isCorrectPassword", () => {
  it("accepts the expected password", () => {
    expect(isCorrectPassword("correct horse", "correct horse")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(isCorrectPassword("correct horse", "wrong horse")).toBe(false);
  });

  it("rejects a password of a different length", () => {
    // Hashing before comparison equalises lengths, so a short guess is indistinguishable
    // from a wrong one.
    expect(isCorrectPassword("correct horse", "c")).toBe(false);
    expect(isCorrectPassword("correct horse", "correct horse++++")).toBe(false);
  });

  it("rejects non-string input without throwing", () => {
    for (const value of [undefined, null, 42, {}, []]) {
      expect(isCorrectPassword("correct horse", value)).toBe(false);
    }
  });

  it("rejects an empty submission", () => {
    expect(isCorrectPassword("correct horse", "")).toBe(false);
  });
});
