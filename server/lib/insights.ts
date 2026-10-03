import type { FitnessGoal } from "../../shared/fitness.js";

export interface WeightSample {
  date: string;
  weightKg: number;
}

export interface TodayInsight {
  id: "shorter-workout" | "calorie-adjustment";
  title: string;
  description: string;
  actionLabel: string;
  dismissLabel: string;
  calorieDelta?: number;
}

export function getTodayInsights(input: {
  missedPlannedSessions: number;
  goal: FitnessGoal;
  weights: readonly WeightSample[];
}): TodayInsight[] {
  const insights: TodayInsight[] = [];
  if (input.missedPlannedSessions >= 2) {
    insights.push({
      id: "shorter-workout",
      title: "Make the next session easier to start",
      description: `${input.missedPlannedSessions} planned sessions were missed recently. A shorter workout can help you get back into rhythm.`,
      actionLabel: "Use a shorter session",
      dismissLabel: "Dismiss",
    });
  }

  const sorted = [...input.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length >= 2 && input.goal !== "maintain") {
    const first = sorted[0]!.weightKg;
    const last = sorted[sorted.length - 1]!.weightKg;
    const movedTowardGoal = input.goal === "fat_loss" ? last < first - 0.2 : last > first + 0.2;
    if (!movedTowardGoal) {
      const calorieDelta = input.goal === "fat_loss" ? -150 : 150;
      insights.push({
        id: "calorie-adjustment",
        title: "Your weight trend has been steady for two weeks",
        description: `Consider adjusting your daily calorie target by ${Math.abs(calorieDelta)} calories, then review the trend again in two weeks.`,
        actionLabel: "Accept adjustment",
        dismissLabel: "Dismiss",
        calorieDelta,
      });
    }
  }
  return insights.slice(0, 3);
}
