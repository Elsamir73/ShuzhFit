import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { getNextSetTarget } from "../../../shared/progression.js";
import { calculateEstimatedOneRepMax } from "../../../shared/fitness.js";
import { requireAuth, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const numeric = (value: string | number | null | undefined) => Number(value ?? 0);

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  const user = await requireAuth(req, res);
  if (!user) return;
  const workoutId = Number(first(req.query?.id));
  const userId = Number(user.id);
  if (!Number.isSafeInteger(workoutId) || workoutId < 1) {
    sendError(res, 400, "INVALID_WORKOUT_ID", "A valid workout ID is required.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const [workout] = await db.select().from(schema.workouts).where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.userId, userId))).limit(1);
    if (!workout) {
      sendError(res, 404, "WORKOUT_NOT_FOUND", "Workout not found.");
      return;
    }
    const currentRows = await db.select().from(schema.workoutSets)
      .where(and(eq(schema.workoutSets.workoutId, workoutId), eq(schema.workoutSets.userId, userId)))
      .orderBy(asc(schema.workoutSets.createdAt), asc(schema.workoutSets.setNumber));
    const exerciseNames = [...new Set(currentRows.map((row) => row.exerciseName))];
    const previousRows = exerciseNames.length ? await db.select({ workoutId: schema.workouts.id, finishedAt: schema.workouts.finishedAt, exerciseId: schema.workoutSets.exerciseId, exerciseName: schema.workoutSets.exerciseName, setNumber: schema.workoutSets.setNumber, reps: schema.workoutSets.reps, weightKg: schema.workoutSets.weightKg, isWarmup: schema.workoutSets.isWarmup })
      .from(schema.workoutSets).innerJoin(schema.workouts, eq(schema.workoutSets.workoutId, schema.workouts.id))
      .where(and(eq(schema.workoutSets.userId, userId), eq(schema.workouts.status, "finished"), ne(schema.workouts.id, workoutId), inArray(schema.workoutSets.exerciseName, exerciseNames)))
      .orderBy(desc(schema.workouts.finishedAt), desc(schema.workoutSets.setNumber)) : [];
    const priorWorkoutByExercise = new Map<string, number>();
    for (const row of previousRows) if (!priorWorkoutByExercise.has(row.exerciseName)) priorWorkoutByExercise.set(row.exerciseName, row.workoutId);
    const repTargets = workout.programDayId ? await db.select({ exerciseId: schema.programDayExercises.exerciseId, repMin: schema.programDayExercises.repMin, repMax: schema.programDayExercises.repMax })
      .from(schema.programDayExercises).where(eq(schema.programDayExercises.programDayId, workout.programDayId)) : [];
    const exercises = [...new Set(currentRows.map((row) => row.exerciseName))].map((exerciseName) => {
      const rows = currentRows.filter((row) => row.exerciseName === exerciseName);
      const firstRow = rows[0]!;
      const target = repTargets.find((item) => item.exerciseId === firstRow.exerciseId);
      const repMin = target?.repMin ?? 8;
      const repMax = target?.repMax ?? 12;
      const previousWorkoutId = priorWorkoutByExercise.get(exerciseName);
      const lastSets = previousWorkoutId ? previousRows.filter((item) => item.exerciseName === exerciseName && item.workoutId === previousWorkoutId && item.setNumber > 0)
        .filter((item) => !item.isWarmup).map((item) => ({ setNumber: item.setNumber, reps: item.reps, weightKg: numeric(item.weightKg), isWarmup: item.isWarmup })) : [];
      return {
        exerciseId: firstRow.exerciseId,
        exerciseName,
        repMin,
        repMax,
        sets: rows.filter((row) => row.setNumber > 0).map((row) => ({ id: row.id, setNumber: row.setNumber, reps: row.reps, weightKg: numeric(row.weightKg), isWarmup: row.isWarmup })),
        hasPlaceholder: rows.some((row) => row.setNumber === 0),
        lastSession: lastSets,
        nextTarget: getNextSetTarget({ exerciseName, previousSets: lastSets, repMin, repMax }),
      };
    });
    const workingSets = currentRows.filter((row) => row.setNumber > 0 && !row.isWarmup);
    const summary = workout.status === "finished" ? (() => {
      const currentBest = new Map<string, number>();
      for (const set of workingSets) currentBest.set(set.exerciseName, Math.max(currentBest.get(set.exerciseName) ?? 0, calculateEstimatedOneRepMax(numeric(set.weightKg), set.reps)));
      const previousBest = new Map<string, number>();
      for (const set of previousRows.filter((item) => !item.isWarmup)) previousBest.set(set.exerciseName, Math.max(previousBest.get(set.exerciseName) ?? 0, calculateEstimatedOneRepMax(numeric(set.weightKg), set.reps)));
      return {
        setCount: currentRows.filter((row) => row.setNumber > 0).length,
        volumeKg: Number(workingSets.reduce((sum, set) => sum + numeric(set.weightKg) * set.reps, 0).toFixed(1)),
        durationSeconds: workout.durationSeconds ?? 0,
        personalRecords: [...currentBest.entries()].filter(([name, value]) => value > (previousBest.get(name) ?? 0)).map(([exerciseName, estimated1Rm]) => ({ exerciseName, estimated1Rm: Number(estimated1Rm.toFixed(1)), previous1Rm: Number((previousBest.get(exerciseName) ?? 0).toFixed(1)) })),
      };
    })() : null;
    res.status(200).json({
      workout: { id: workout.id, name: workout.name, status: workout.status, startedAt: workout.startedAt, finishedAt: workout.finishedAt, durationSeconds: workout.durationSeconds ?? 0, notes: workout.notes ?? "", programDayId: workout.programDayId },
      exercises,
      summary,
    });
  } catch {
    sendError(res, 500, "WORKOUT_LOOKUP_FAILED", "Unable to load this workout.");
  }
}
