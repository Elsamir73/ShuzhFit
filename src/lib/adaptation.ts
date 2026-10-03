export type AdaptationType = "shorter-workout" | "calorie-adjustment";

export type AdaptationRecommendation = {
  type: AdaptationType;
  title: string;
  description: string;
  actionLabel: string;
  dismissLabel: string;
};

type ProgressLike = {
  date?: string;
  createdAt?: string;
  weightKg: number;
};

type WorkoutLike = {
  createdAt?: string;
};

type ProfileLike = {
  daysPerWeek?: number;
};

export function getAdaptationRecommendations({
  profile,
  workouts = [],
  progress = [],
}: {
  profile?: ProfileLike;
  workouts?: WorkoutLike[];
  progress?: ProgressLike[];
}): AdaptationRecommendation[] {
  const recommendations: AdaptationRecommendation[] = [];
  const targetDays = Math.max(1, profile?.daysPerWeek ?? 4);
  const now = Date.now();
  const recentWindowMs = 14 * 24 * 60 * 60 * 1000;

  const recentWorkouts = workouts.filter((entry) => {
    const timestamp = entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
    return Number.isFinite(timestamp) && now - timestamp <= recentWindowMs;
  });

  const missedSessions = Math.max(0, targetDays - recentWorkouts.length);

  if (missedSessions >= 2) {
    recommendations.push({
      type: "shorter-workout",
      title: "Missed sessions are stacking up",
      description:
        "You have missed at least two sessions in the last two weeks. A shorter, high-quality workout is the best next step to keep momentum without burning out.",
      actionLabel: "Use shorter workout",
      dismissLabel: "Dismiss",
    });
  }

  const recentProgress = [...progress].sort((left, right) => {
    const leftTime = new Date(left.date ?? left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.date ?? right.createdAt ?? 0).getTime();
    return leftTime - rightTime;
  });

  if (recentProgress.length >= 2) {
    const latestEntry = recentProgress[recentProgress.length - 1];
    const previousEntry = recentProgress[recentProgress.length - 2];
    const latestTime = new Date(
      latestEntry.date ?? latestEntry.createdAt ?? 0,
    ).getTime();
    const previousTime = new Date(
      previousEntry.date ?? previousEntry.createdAt ?? 0,
    ).getTime();

    if (
      Number.isFinite(latestTime) &&
      Number.isFinite(previousTime) &&
      (now - latestTime <= recentWindowMs ||
        now - previousTime <= recentWindowMs)
    ) {
      const previousWeight = previousEntry.weightKg ?? 0;
      const latestWeight = latestEntry.weightKg ?? 0;
      const delta = Math.abs(latestWeight - previousWeight);

      if (delta <= 0.5) {
        recommendations.push({
          type: "calorie-adjustment",
          title: "Weight has stalled for 14 days",
          description:
            "Your scale has been flat for the last two weeks. Small calorie adjustments often restart momentum faster than pushing harder without recovery.",
          actionLabel: "Adjust calories",
          dismissLabel: "Dismiss",
        });
      }
    }
  }

  return recommendations;
}
