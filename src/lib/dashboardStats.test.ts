import { describe, expect, it } from "vitest";
import { summarizeDashboardData } from "./dashboardStats";

describe("summarizeDashboardData", () => {
  it("uses recent workout, meal, and progress entries to build the dashboard snapshot", () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const snapshot = summarizeDashboardData({
      workouts: [
        {
          id: "w-1",
          createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "w-2",
          createdAt: new Date(now - 2 * day).toISOString(),
        },
      ],
      meals: [
        {
          id: "m-1",
          createdAt: new Date(now - 3 * day).toISOString(),
        },
        {
          id: "m-2",
          createdAt: new Date(now - 5 * day).toISOString(),
        },
        {
          id: "m-3",
          createdAt: new Date(now - 6 * day).toISOString(),
        },
      ],
      progress: [
        {
          id: "p-1",
          date: new Date(now - 1 * day).toISOString().slice(0, 10),
          weightKg: 79.7,
          createdAt: new Date(now - 1 * day).toISOString(),
        },
        {
          id: "p-2",
          date: new Date(now - 8 * day).toISOString().slice(0, 10),
          weightKg: 78.5,
          createdAt: new Date(now - 8 * day).toISOString(),
        },
      ],
      profile: {
        weeklyWorkoutTarget: 4,
        goalType: "fat-loss",
      },
    });

    expect(snapshot.workoutCount).toBe(2);
    expect(snapshot.nutritionPercent).toBe(75);
    expect(snapshot.progressDeltaLabel).toBe("+1.2 kg");
    expect(snapshot.goalCount).toBe(1);
  });
});
