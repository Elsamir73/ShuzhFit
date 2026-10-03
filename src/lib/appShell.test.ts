import { describe, expect, it } from "vitest";
import { isAppRoute } from "./appShell";

describe("isAppRoute", () => {
  it("recognizes protected member routes and ignores public pages", () => {
    expect(isAppRoute("/today")).toBe(true);
    expect(isAppRoute("/workout/abc-123")).toBe(true);
    expect(isAppRoute("/progress")).toBe(true);
    expect(isAppRoute("/blog")).toBe(false);
    expect(isAppRoute("/exercises/barbell-back-squat")).toBe(false);
  });
});
