import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { calculateEstimatedOneRepMax } from "../../shared/fitness.js";
import { filterPlanExercises } from "../../shared/program.js";
import { requireAuth, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../lib/http.js";

const startSchema = z.object({ programDayId: z.number().int().positive().optional(), name: z.string().trim().min(1).max(200).optional() });
const finishSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("finish"), notes: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("discard") }),
]);
const textQuery = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const isoDate = (value: Date) => value.toISOString();

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method ?? "")) {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = Number(user.id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    sendError(res, 401, "UNAUTHORIZED", "Please sign in to continue.");
    return;
  }

  try {
    const [{ db }, schema] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    if (req.method === "GET") {
      if (textQuery(req.query?.current) === "true") {
        const [activeWorkout] = await db.select().from(schema.workouts).where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "in_progress"))).limit(1);
        const [profile] = await db.select({ equipment: schema.users.equipment, experience: schema.users.experience }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        const candidates = await db.select({ id: schema.exercises.id, name: schema.exercises.name, equipment: schema.exercises.equipment, level: schema.exercises.difficulty, muscles: schema.exercises.muscles }).from(schema.exercises).where(eq(schema.exercises.isPublished, true));
        res.status(200).json({
          activeWorkout: activeWorkout ? { id: activeWorkout.id, name: activeWorkout.name } : null,
          exerciseOptions: profile ? filterPlanExercises(candidates, profile.equipment ?? "gym", profile.experience ?? "beginner") : candidates,
        });
        return;
      }
      const requestedPage = Number(textQuery(req.query?.page) ?? 1);
      const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
      const offset = (page - 1) * 10;
      const [workoutRows, quickRows] = await Promise.all([
        db.select().from(schema.workouts).where(eq(schema.workouts.userId, userId)).orderBy(desc(schema.workouts.workoutDate), desc(schema.workouts.createdAt)).limit(11).offset(offset),
        db.select().from(schema.workoutLogs).where(eq(schema.workoutLogs.userId, userId)).orderBy(desc(schema.workoutLogs.logDate), desc(schema.workoutLogs.createdAt)).limit(11).offset(offset),
      ]);
      const workoutIds = workoutRows.map((row) => row.id);
      const setRows = workoutIds.length ? await db.select().from(schema.workoutSets).where(and(eq(schema.workoutSets.userId, userId), inArray(schema.workoutSets.workoutId, workoutIds))) : [];
      const activities = [
        ...workoutRows.map((row) => {
          const sets = setRows.filter((set) => set.workoutId === row.id && set.setNumber > 0);
          return {
            type: "workout" as const, id: String(row.id), name: row.name, status: row.status,
            date: row.finishedAt ? isoDate(row.finishedAt) : isoDate(row.createdAt),
            workoutDate: isoDate(row.workoutDate), durationSeconds: row.durationSeconds ?? 0,
            setCount: sets.length, exerciseCount: new Set(sets.map((set) => set.exerciseName)).size,
            volumeKg: sets.reduce((sum, set) => sum + Number(set.weightKg ?? 0) * set.reps, 0), notes: row.notes ?? "",
          };
        }),
        ...quickRows.map((row) => ({
          type: "quick" as const, id: String(row.id), name: row.workoutType ?? row.exerciseName,
          status: "finished" as const, date: isoDate(row.createdAt), workoutDate: isoDate(row.logDate),
          durationSeconds: (row.durationMinutes ?? 0) * 60, setCount: 0, exerciseCount: 0, volumeKg: 0, notes: row.note ?? "",
        })),
      ].sort((a, b) => b.date.localeCompare(a.date));
      res.status(200).json({ items: activities.slice(0, 10), page, hasMore: activities.length > 10 });
      return;
    }

    if (req.method === "POST") {
      const input = parseBody(startSchema, req.body);
      if (!input) {
        sendError(res, 400, "INVALID_INPUT", "Choose a valid planned day or start an empty workout.");
        return;
      }
      const [existing] = await db.select({ id: schema.workouts.id }).from(schema.workouts).where(and(eq(schema.workouts.userId, userId), eq(schema.workouts.status, "in_progress"))).limit(1);
      if (existing) {
        sendError(res, 409, "WORKOUT_ALREADY_ACTIVE", "Finish or discard your current workout before starting another.");
        return;
      }
      let plannedName: string | undefined;
      let plannedExerciseRows: Array<{ id: number; name: string }> = [];
      if (input.programDayId) {
        const [day] = await db.select({ id: schema.programDays.id, name: schema.programDays.name }).from(schema.programDays)
          .innerJoin(schema.programs, eq(schema.programDays.programId, schema.programs.id))
          .where(and(eq(schema.programDays.id, input.programDayId), eq(schema.programs.userId, userId), eq(schema.programs.isActive, true))).limit(1);
        if (!day) {
          sendError(res, 404, "PLAN_DAY_NOT_FOUND", "That training day is not in your active plan.");
          return;
        }
        plannedName = day.name;
        plannedExerciseRows = await db.select({ id: schema.exercises.id, name: schema.exercises.name }).from(schema.programDayExercises)
          .innerJoin(schema.exercises, eq(schema.programDayExercises.exerciseId, schema.exercises.id))
          .where(eq(schema.programDayExercises.programDayId, day.id)).orderBy(asc(schema.programDayExercises.position));
      }
      const startedAt = new Date();
      try {
        const [workout] = await db.insert(schema.workouts).values({
          userId, name: input.name ?? plannedName ?? "Workout", status: "in_progress",
          workoutDate: new Date(Date.UTC(startedAt.getUTCFullYear(), startedAt.getUTCMonth(), startedAt.getUTCDate())),
          programDayId: input.programDayId ?? null, startedAt,
        }).returning();
        if (!workout) throw new Error("Workout was not created.");
        if (plannedExerciseRows.length) {
          await db.insert(schema.workoutSets).values(plannedExerciseRows.map((exercise) => ({
            workoutId: workout.id, userId, exerciseId: exercise.id, exerciseName: exercise.name,
            setNumber: 0, reps: 0, weightKg: null,
          })));
        }
        res.status(201).json({ id: workout.id, name: workout.name, startedAt: workout.startedAt, status: workout.status });
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
          sendError(res, 409, "WORKOUT_ALREADY_ACTIVE", "Finish or discard your current workout before starting another.");
          return;
        }
        throw error;
      }
      return;
    }

    const workoutId = Number(textQuery(req.query?.id));
    if (!Number.isSafeInteger(workoutId) || workoutId < 1) {
      sendError(res, 400, "INVALID_WORKOUT_ID", "A valid workout ID is required.");
      return;
    }
    const [workout] = await db.select().from(schema.workouts).where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.userId, userId))).limit(1);
    if (!workout) {
      sendError(res, 404, "WORKOUT_NOT_FOUND", "Workout not found.");
      return;
    }
    if (req.method === "DELETE") {
      await db.delete(schema.workouts).where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.userId, userId)));
      res.status(200).json({ success: true });
      return;
    }
    const input = parseBody(finishSchema, req.body);
    if (!input) {
      sendError(res, 400, "INVALID_INPUT", "Choose finish or discard.");
      return;
    }
    if (workout.status !== "in_progress") {
      sendError(res, 409, "WORKOUT_NOT_ACTIVE", "Only an in-progress workout can be finished or discarded.");
      return;
    }
    if (input.action === "discard") {
      await db.delete(schema.workouts).where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.userId, userId), eq(schema.workouts.status, "in_progress")));
      res.status(200).json({ success: true, discarded: true });
      return;
    }
    const sets = await db.select().from(schema.workoutSets).where(and(eq(schema.workoutSets.workoutId, workoutId), eq(schema.workoutSets.userId, userId)));
    const workingSets = sets.filter((set) => set.setNumber > 0);
    if (!workingSets.length) {
      sendError(res, 400, "NO_WORKING_SETS", "Log at least one set before finishing this workout.");
      return;
    }
    const durationSeconds = workout.startedAt ? Math.floor((Date.now() - workout.startedAt.getTime()) / 1000) : 0;
    if (durationSeconds < 60) {
      sendError(res, 400, "WORKOUT_TOO_SHORT", "A workout must last at least 60 seconds before it can be finished.");
      return;
    }
    const finishedAt = new Date();
    await db.update(schema.workouts).set({ status: "finished", finishedAt, durationSeconds, notes: input.notes ?? null })
      .where(and(eq(schema.workouts.id, workoutId), eq(schema.workouts.userId, userId), eq(schema.workouts.status, "in_progress")));

    const previousRows = await db.select({ exerciseName: schema.workoutSets.exerciseName, weightKg: schema.workoutSets.weightKg, reps: schema.workoutSets.reps, isWarmup: schema.workoutSets.isWarmup })
      .from(schema.workoutSets).innerJoin(schema.workouts, eq(schema.workoutSets.workoutId, schema.workouts.id))
      .where(and(eq(schema.workoutSets.userId, userId), eq(schema.workouts.status, "finished"), ne(schema.workouts.id, workoutId)));
    const previousBest = new Map<string, number>();
    for (const set of previousRows.filter((item) => !item.isWarmup)) {
      const estimated = calculateEstimatedOneRepMax(Number(set.weightKg ?? 0), set.reps);
      previousBest.set(set.exerciseName, Math.max(previousBest.get(set.exerciseName) ?? 0, estimated));
    }
    const currentBest = new Map<string, number>();
    for (const set of workingSets.filter((item) => !item.isWarmup)) {
      const estimated = calculateEstimatedOneRepMax(Number(set.weightKg ?? 0), set.reps);
      currentBest.set(set.exerciseName, Math.max(currentBest.get(set.exerciseName) ?? 0, estimated));
    }
    const personalRecords = [...currentBest.entries()].filter(([name, value]) => value > (previousBest.get(name) ?? 0))
      .map(([exerciseName, estimated1Rm]) => ({ exerciseName, estimated1Rm: Number(estimated1Rm.toFixed(1)), previous1Rm: Number((previousBest.get(exerciseName) ?? 0).toFixed(1)) }));
    const [program] = await db.select({ id: schema.programs.id }).from(schema.programs).where(and(eq(schema.programs.userId, userId), eq(schema.programs.isActive, true))).limit(1);
    const upcomingDays = program ? await db.select({ name: schema.programDays.name, weekday: schema.programDays.weekday }).from(schema.programDays)
      .where(eq(schema.programDays.programId, program.id)).orderBy(asc(schema.programDays.dayIndex)) : [];
    const todayWeekday = (finishedAt.getUTCDay() + 6) % 7;
    const nextSession = upcomingDays.find((day) => day.weekday !== null && day.weekday > todayWeekday) ?? upcomingDays.find((day) => day.weekday !== null);
    res.status(200).json({
      success: true,
      summary: {
        workoutId, setCount: workingSets.length,
        volumeKg: Number(workingSets.reduce((sum, set) => sum + Number(set.weightKg ?? 0) * set.reps, 0).toFixed(1)),
        durationSeconds, personalRecords, nextPlannedSession: nextSession?.name ?? null,
      },
    });
  } catch {
    sendError(res, 500, "WORKOUT_REQUEST_FAILED", "Unable to load or save this workout.");
  }
}
