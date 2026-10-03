export interface SetTargetInput {
  weightKg: number;
  reps: number;
}

export function getNextSetTarget(input: {
  exerciseName: string;
  previousSets: readonly SetTargetInput[];
  repMin: number;
  repMax: number;
}): SetTargetInput {
  const heaviest = input.previousSets.reduce((max, set) => Math.max(max, set.weightKg), 0);
  const bestReps = input.previousSets.reduce((max, set) => Math.max(max, set.reps), 0);
  if (!input.previousSets.length) return { weightKg: 0, reps: input.repMin };
  if (bestReps >= input.repMax) {
    const lowerBody = /squat|deadlift|lunge|hinge|leg|romanian|rdl|goblet|hip thrust/i.test(input.exerciseName);
    return { weightKg: Number((heaviest + (lowerBody ? 5 : 2.5)).toFixed(1)), reps: input.repMin };
  }
  return { weightKg: heaviest, reps: Math.min(input.repMax, bestReps + 1) };
}
