type WorkoutLike = {
  id?: string;
  createdAt: string;
};

type MealLike = {
  id?: string;
  createdAt: string;
};

type ProgressLike = {
  id?: string;
  createdAt?: string;
  date?: string;
  weightKg: number;
};

type ProfileLike = {
  weeklyWorkoutTarget?: number;
  goalType?: string;
};

export type DashboardSummary = {
  workoutCount: number;
  nutritionPercent: number;
  progressDeltaLabel: string;
  goalCount: number;
};

export function summarizeDashboardData({
  workouts,
  meals,
  progress,
  profile,
}: {
  workouts: WorkoutLike[];
  meals: MealLike[];
  progress: ProgressLike[];
  profile?: ProfileLike;
}): DashboardSummary {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const workoutCount = workouts.filter(
    (entry) => now - new Date(entry.createdAt).getTime() <= weekMs,
  ).length;

  const nutritionCount = meals.filter(
    (entry) => now - new Date(entry.createdAt).getTime() <= weekMs,
  ).length;

  const target = Math.max(profile?.weeklyWorkoutTarget ?? 4, 1);
  const nutritionPercent = Math.min(
    100,
    Math.round((nutritionCount / target) * 100),
  );

  const sortedProgress = [...progress].sort((a, b) => {
    const left = new Date(a.createdAt ?? a.date ?? 0).getTime();
    const right = new Date(b.createdAt ?? b.date ?? 0).getTime();
    return right - left;
  });

  let progressDeltaLabel = "—";

  if (sortedProgress.length >= 2) {
    const newest = sortedProgress[0]?.weightKg ?? 0;
    const previous = sortedProgress[1]?.weightKg ?? newest;
    const delta = newest - previous;

    if (Math.abs(delta) >= 0.1) {
      progressDeltaLabel = `${delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(1)} kg`;
    } else {
      progressDeltaLabel = "0.0 kg";
    }
  }

  return {
    workoutCount,
    nutritionPercent,
    progressDeltaLabel,
    goalCount: profile?.goalType ? 1 : 0,
  };
}
