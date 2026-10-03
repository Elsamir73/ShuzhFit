import { describe, expect, it } from "vitest";
import { calculateEstimatedOneRepMax, calculateGoalProgressToward, calculateStreak } from "./fitness";

describe("fitness calculations", () => {
  it("counts a streak through today or yesterday", () => {
    expect(calculateStreak(["2026-10-03", "2026-10-02", "2026-10-01"], "2026-10-03")).toBe(3);
    expect(calculateStreak(["2026-10-02", "2026-10-01"], "2026-10-03")).toBe(2);
    expect(calculateStreak(["2026-09-30"], "2026-10-03")).toBe(0);
  });

  it("estimates one-rep max with Epley", () => {
    expect(calculateEstimatedOneRepMax(100, 10)).toBeCloseTo(133.333, 2);
    expect(calculateEstimatedOneRepMax(80, 0)).toBe(0);
  });

  it("calculates goal progress in the desired direction", () => {
    expect(calculateGoalProgressToward(80, 75, 70, "decrease")).toBe(50);
    expect(calculateGoalProgressToward(40, 55, 70, "increase")).toBe(50);
    expect(calculateGoalProgressToward(80, 85, 70, "decrease")).toBe(0);
  });
});
