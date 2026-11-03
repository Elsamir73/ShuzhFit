import { describe, expect, it } from "vitest";
import {
  createVerificationToken,
  hashVerificationToken,
  isVerificationTokenExpired,
} from "./emailVerification.js";

describe("email verification token helpers", () => {
  it("creates a random token and stores only its SHA-256 hash", () => {
    const first = createVerificationToken();
    const second = createVerificationToken();
    expect(first.token).toHaveLength(64);
    expect(first.tokenHash).toBe(hashVerificationToken(first.token));
    expect(first.tokenHash).not.toBe(first.token);
    expect(second.token).not.toBe(first.token);
  });

  it("considers a token expired at and after its expiry time", () => {
    const expiry = new Date("2025-01-02T00:00:00.000Z");
    expect(isVerificationTokenExpired(expiry, new Date("2025-01-01T23:59:59.999Z"))).toBe(false);
    expect(isVerificationTokenExpired(expiry, expiry)).toBe(true);
    expect(isVerificationTokenExpired(expiry, new Date("2025-01-02T00:00:00.001Z"))).toBe(true);
  });
});
