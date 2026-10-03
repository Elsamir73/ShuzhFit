export type FitnessGoal = "fat_loss" | "maintain" | "muscle_gain";
export type SexAtBirth = "male" | "female" | "other";

export interface FitnessMetricsInput {
  ageYears: number;
  sex: SexAtBirth;
  heightCm: number;
  weightKg: number;
  activityLevel: number;
  goal: FitnessGoal;
}

export interface FitnessMetrics {
  bmrCalories: number;
  maintenanceCalories: number;
  calorieTarget: number;
  proteinTargetG: number;
  waterTargetMl: number;
}

// Assumes Mifflin-St Jeor, a midpoint sex coefficient when sex is other, 35 ml water/kg,
// protein at 1.6 g/kg, and a modest 350 kcal cut or 250 kcal surplus.
export function calculateFitnessMetrics(input: FitnessMetricsInput): FitnessMetrics {
  const sexAdjustment = input.sex === "male" ? 5 : input.sex === "female" ? -161 : -78;
  const bmrCalories = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears + sexAdjustment;
  const maintenanceCalories = bmrCalories * input.activityLevel;
  const calorieTarget = input.goal === "fat_loss"
    ? maintenanceCalories - 350
    : input.goal === "muscle_gain" ? maintenanceCalories + 250 : maintenanceCalories;
  return {
    bmrCalories: Math.round(bmrCalories),
    maintenanceCalories: Math.round(maintenanceCalories),
    calorieTarget: Math.max(1200, Math.round(calorieTarget)),
    proteinTargetG: Math.round(input.weightKg * 1.6),
    waterTargetMl: Math.round(input.weightKg * 35),
  };
}

export function calculateEstimatedOneRepMax(weightKg: number, reps: number): number {
  return reps > 0 ? weightKg * (1 + reps / 30) : 0;
}

export function calculateGoalProgress(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function calculateStreak(activityDates: readonly string[], todayIso: string): number {
  const activeDates = new Set(activityDates.map((value) => value.slice(0, 10)));
  const today = new Date(`${todayIso.slice(0, 10)}T00:00:00.000Z`);
  if (!activeDates.has(todayIso.slice(0, 10))) today.setUTCDate(today.getUTCDate() - 1);
  let streak = 0;
  while (activeDates.has(today.toISOString().slice(0, 10))) {
    streak += 1;
    today.setUTCDate(today.getUTCDate() - 1);
  }
  return streak;
}

export function calculateGoalProgressToward(
  start: number,
  current: number,
  target: number,
  direction: "increase" | "decrease",
): number {
  const distance = direction === "increase" ? target - start : start - target;
  if (distance <= 0) return current === target ? 100 : 0;
  const progress = direction === "increase" ? current - start : start - current;
  return Math.min(100, Math.max(0, Math.round((progress / distance) * 100)));
}
