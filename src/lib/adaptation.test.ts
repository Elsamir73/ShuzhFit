import { describe, expect, it } from "vitest";
import { getAdaptationRecommendations } from "./adaptation";

describe("getAdaptationRecommendations", () => {
  it("flags missed sessions and a weight stall for adjustment", () => {
    const recommendations = getAdaptationRecommendations({
      profile: { daysPerWeek: 4 },
      workouts: [
        {
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
        },
        {
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 9,
          ).toISOString(),
        },
      ],
      progress: [
        {
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
          weightKg: 78.2,
        },
        {
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
          weightKg: 78.3,
        },
      ],
    });

    expect(
      recommendations.some((item) => item.type === "shorter-workout"),
    ).toBe(true);
    expect(
      recommendations.some((item) => item.type === "calorie-adjustment"),
    ).toBe(true);
  });
});
