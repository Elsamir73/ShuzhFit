import { describe, expect, it } from "vitest";
import { toCsv } from "./csv.js";

describe("toCsv", () => {
  it("escapes quotes and line breaks in member data", () => {
    expect(toCsv([{ name: 'Sam "S"\nLee', email: "sam@example.com" }], ["name", "email"])).toBe('"name","email"\r\n"Sam ""S""\nLee","sam@example.com"');
  });
});
