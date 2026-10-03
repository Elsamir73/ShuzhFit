import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { calculateEstimatedOneRepMax } from "../../../../shared/fitness.js";
import {
  requireAuth,
  parseBody,
  requireJson,
  requireOrigin,
  sendError,
  type ApiRequest,
  type ApiResponse,
} from "../../../lib/http.js";

const addSetSchema = z.object({
  exerciseName: z.string().trim().min(1).max(200),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(1).max(100),
  isWarmup: z.boolean().default(false),
});
const deleteSetSchema = z.object({ setId: z.number().int().positive() });
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  if (req.method !== "POST" && req.method !== "DELETE") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = Number(user.id);
  const workoutId = Number(first(req.query?.id));
  if (!Number.isSafeInteger(workoutId) || workoutId < 1) {
    sendError(
      res,
      400,
      "INVALID_WORKOUT_ID",
      "A valid workout ID is required.",
    );
    return;
  }
  const input = parseBody(
    req.method === "POST" ? addSetSchema : deleteSetSchema,
    req.body,
  );
  if (!input) {
    sendError(
      res,
      400,
      "INVALID_INPUT",
      "Enter valid reps and weight for this set.",
    );
    return;
  }
  try {
    const [{ db }, schema] = await Promise.all([
      import("../../../../db/index.js"),
      import("../../../../db/schema.js"),
    ]);
    const [workout] = await db
      .select({ id: schema.workouts.id, status: schema.workouts.status })
      .from(schema.workouts)
      .where(
        and(
          eq(schema.workouts.id, workoutId),
          eq(schema.workouts.userId, userId),
        ),
      )
      .limit(1);
    if (!workout) {
      sendError(res, 404, "WORKOUT_NOT_FOUND", "Workout not found.");
      return;
    }
    if (workout.status !== "in_progress") {
      sendError(
        res,
        409,
        "WORKOUT_NOT_ACTIVE",
        "Sets can only change during an active workout.",
      );
      return;
    }
    if (req.method === "DELETE") {
      const { setId } = input as z.output<typeof deleteSetSchema>;
      const [set] = await db
        .select()
        .from(schema.workoutSets)
        .where(
          and(
            eq(schema.workoutSets.id, setId),
            eq(schema.workoutSets.workoutId, workoutId),
            eq(schema.workoutSets.userId, userId),
            ne(schema.workoutSets.setNumber, 0),
          ),
        )
        .limit(1);
      if (!set) {
        sendError(
          res,
          404,
          "SET_NOT_FOUND",
          "That set was not found in this workout.",
        );
        return;
      }
      await db
        .delete(schema.workoutSets)
        .where(
          and(
            eq(schema.workoutSets.id, setId),
            eq(schema.workoutSets.workoutId, workoutId),
            eq(schema.workoutSets.userId, userId),
          ),
        );
      const [remaining] = await db
        .select({ id: schema.workoutSets.id })
        .from(schema.workoutSets)
        .where(
          and(
            eq(schema.workoutSets.workoutId, workoutId),
            eq(schema.workoutSets.userId, userId),
            eq(schema.workoutSets.exerciseName, set.exerciseName),
          ),
        )
        .limit(1);
      if (!remaining)
        await db
          .insert(schema.workoutSets)
          .values({
            workoutId,
            userId,
            exerciseId: set.exerciseId,
            exerciseName: set.exerciseName,
            setNumber: 0,
            reps: 0,
            weightKg: null,
          });
      res.status(200).json({ success: true });
      return;
    }

    const add = input as z.output<typeof addSetSchema>;
    const [exercise] = await db
      .select()
      .from(schema.workoutSets)
      .where(
        and(
          eq(schema.workoutSets.workoutId, workoutId),
          eq(schema.workoutSets.userId, userId),
          eq(schema.workoutSets.exerciseName, add.exerciseName),
        ),
      )
      .limit(1);
    if (!exercise) {
      sendError(
        res,
        404,
        "EXERCISE_NOT_IN_WORKOUT",
        "Add this exercise to the workout before logging sets.",
      );
      return;
    }
    const sessionSets = await db
      .select({
        setNumber: schema.workoutSets.setNumber,
        weightKg: schema.workoutSets.weightKg,
        reps: schema.workoutSets.reps,
        isWarmup: schema.workoutSets.isWarmup,
      })
      .from(schema.workoutSets)
      .where(
        and(
          eq(schema.workoutSets.workoutId, workoutId),
          eq(schema.workoutSets.userId, userId),
          eq(schema.workoutSets.exerciseName, add.exerciseName),
        ),
      );
    const setNumber =
      Math.max(0, ...sessionSets.map((set) => set.setNumber)) + 1;
    const [loggedSet] = await db
      .insert(schema.workoutSets)
      .values({
        workoutId,
        userId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        setNumber,
        weightKg: String(add.weightKg),
        reps: add.reps,
        isWarmup: add.isWarmup,
      })
      .returning();
    await db
      .delete(schema.workoutSets)
      .where(
        and(
          eq(schema.workoutSets.workoutId, workoutId),
          eq(schema.workoutSets.userId, userId),
          eq(schema.workoutSets.exerciseName, add.exerciseName),
          eq(schema.workoutSets.setNumber, 0),
        ),
      );
    const previous = await db
      .select({
        weightKg: schema.workoutSets.weightKg,
        reps: schema.workoutSets.reps,
        isWarmup: schema.workoutSets.isWarmup,
      })
      .from(schema.workoutSets)
      .innerJoin(
        schema.workouts,
        eq(schema.workoutSets.workoutId, schema.workouts.id),
      )
      .where(
        and(
          eq(schema.workoutSets.userId, userId),
          eq(schema.workoutSets.exerciseName, add.exerciseName),
          eq(schema.workouts.status, "finished"),
        ),
      )
      .orderBy(desc(schema.workouts.finishedAt));
    const priorSessionMax = Math.max(
      0,
      ...previous
        .filter((set) => !set.isWarmup)
        .map((set) =>
          calculateEstimatedOneRepMax(Number(set.weightKg ?? 0), set.reps),
        ),
    );
    const activeSessionMax = Math.max(
      0,
      ...sessionSets
        .filter((set) => set.setNumber > 0 && !set.isWarmup)
        .map((set) =>
          calculateEstimatedOneRepMax(Number(set.weightKg ?? 0), set.reps),
        ),
    );
    const estimated1Rm = calculateEstimatedOneRepMax(add.weightKg, add.reps);
    const newPersonalRecord =
      !add.isWarmup &&
      estimated1Rm > Math.max(priorSessionMax, activeSessionMax);
    res.status(201).json({
      set: loggedSet
        ? {
            id: loggedSet.id,
            setNumber: loggedSet.setNumber,
            reps: loggedSet.reps,
            weightKg: Number(loggedSet.weightKg ?? 0),
            isWarmup: loggedSet.isWarmup,
          }
        : null,
      estimated1Rm: Number(estimated1Rm.toFixed(1)),
      newPersonalRecord,
    });
  } catch {
    sendError(res, 500, "SET_UPDATE_FAILED", "Unable to save this set.");
  }
}
