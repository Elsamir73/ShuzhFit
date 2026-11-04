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

export function countMissedPlannedSessions(input: {
  plannedWeekdays: readonly number[];
  activityDates: readonly string[];
  planCreatedAt: Date | string | null;
  today: Date | string;
  lookbackDays?: number;
}): number {
  if (!input.planCreatedAt) return 0;
  const planCreatedAt = input.planCreatedAt instanceof Date
    ? input.planCreatedAt
    : new Date(input.planCreatedAt);
  const today = input.today instanceof Date ? input.today : new Date(input.today);
  if (!Number.isFinite(planCreatedAt.getTime()) || !Number.isFinite(today.getTime())) return 0;

  const planCreatedDate = planCreatedAt.toISOString().slice(0, 10);
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const activeWeekdays = new Set(input.plannedWeekdays);
  const activityDates = new Set(input.activityDates);
  let missed = 0;

  const lookbackDays = Number.isSafeInteger(input.lookbackDays) && (input.lookbackDays ?? 0) > 0
    ? input.lookbackDays!
    : 13;
  for (let daysAgo = lookbackDays; daysAgo > 0; daysAgo -= 1) {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    const dateKey = date.toISOString().slice(0, 10);
    const weekday = (date.getUTCDay() + 6) % 7;
    if (dateKey > planCreatedDate && activeWeekdays.has(weekday) && !activityDates.has(dateKey)) {
      missed += 1;
    }
  }

  return missed;
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
