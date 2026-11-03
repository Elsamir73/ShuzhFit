import { describe, expect, it } from "vitest";
import { validatePassword } from "./password.js";

describe("validatePassword", () => {
  it("accepts passwords that satisfy the length and character rules", () => {
    expect(validatePassword("RiverStone82")).toBeNull();
  });

  it("enforces the 8 to 64 character range", () => {
    expect(validatePassword("Abc123!")).not.toBeNull();
    expect(validatePassword(`A1${"b".repeat(63)}`)).not.toBeNull();
  });

  it("requires a letter and a number", () => {
    expect(validatePassword("abcdefgh")).not.toBeNull();
    expect(validatePassword("12345678")).not.toBeNull();
  });

  it("rejects common, repeated-character, and simple-sequence passwords", () => {
    expect(validatePassword("Password123")).not.toBeNull();
    expect(validatePassword("aaaaaaaa")).not.toBeNull();
    expect(validatePassword("abcdefgh9")).not.toBeNull();
    expect(validatePassword("x987654321")).not.toBeNull();
  });

  it("rejects the email local part and name", () => {
    expect(validatePassword("samirStrong8", { email: "samir@example.com" })).not.toBeNull();
    expect(validatePassword("PathakStrong8", { name: "Samir Pathak" })).not.toBeNull();
  });
});
