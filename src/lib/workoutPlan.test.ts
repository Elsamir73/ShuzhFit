import { describe, expect, it } from "vitest";
import {
  generateWeeklyPlan,
  getProgressiveOverloadSuggestion,
} from "./workoutPlan";

describe("generateWeeklyPlan", () => {
  it("builds an upper/lower split for a four-day beginner strength profile", () => {
    const plan = generateWeeklyPlan({
      goalType: "strength",
      experience: "beginner",
      daysPerWeek: 4,
      equipment: "barbell and dumbbells",
    });

    expect(plan).toHaveLength(4);
    expect(plan.map((day) => day.split)).toEqual([
      "Upper",
      "Lower",
      "Upper",
      "Lower",
    ]);
    expect(plan[0]?.sessions[0]?.name.toLowerCase()).toContain("bench");
  });
});

describe("getProgressiveOverloadSuggestion", () => {
  it("recommends 2.5 kg jumps for upper-body work and 5 kg jumps for lower-body work", () => {
    expect(getProgressiveOverloadSuggestion("Bench Press", 82.5)).toMatchObject(
      {
        suggestedWeightKg: 85,
        incrementKg: 2.5,
      },
    );

    expect(getProgressiveOverloadSuggestion("Back Squat", 120)).toMatchObject({
      suggestedWeightKg: 125,
      incrementKg: 5,
    });
  });
});
