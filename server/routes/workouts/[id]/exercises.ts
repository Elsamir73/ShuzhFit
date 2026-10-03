import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { filterPlanExercises } from "../../../../shared/program";
import {
  requireAuth,
  parseBody,
  requireJson,
  requireOrigin,
  sendError,
  type ApiRequest,
  type ApiResponse,
} from "../../../lib/http";

const addSchema = z
  .object({
    exerciseId: z.number().int().positive().optional(),
    exerciseName: z.string().trim().min(1).max(200).optional(),
  })
  .refine(
    (value) =>
      value.exerciseId !== undefined || value.exerciseName !== undefined,
  );
const removeSchema = z
  .object({
    exerciseId: z.number().int().positive().optional(),
    exerciseName: z.string().trim().min(1).max(200).optional(),
  })
  .refine(
    (value) =>
      value.exerciseId !== undefined || value.exerciseName !== undefined,
  );
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
    req.method === "POST" ? addSchema : removeSchema,
    req.body,
  );
  if (!input) {
    sendError(
      res,
      400,
      "INVALID_INPUT",
      "Choose an exercise to add or remove.",
    );
    return;
  }
  try {
    const [{ db }, schema] = await Promise.all([
      import("../../../../db"),
      import("../../../../db/schema"),
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
        "Exercises can only change during an active workout.",
      );
      return;
    }
    if (req.method === "DELETE") {
      const remove = input as z.output<typeof removeSchema>;
      const condition =
        remove.exerciseId !== undefined
          ? and(
              eq(schema.workoutSets.workoutId, workoutId),
              eq(schema.workoutSets.userId, userId),
              eq(schema.workoutSets.exerciseId, remove.exerciseId),
            )
          : and(
              eq(schema.workoutSets.workoutId, workoutId),
              eq(schema.workoutSets.userId, userId),
              eq(schema.workoutSets.exerciseName, remove.exerciseName ?? ""),
            );
      await db.delete(schema.workoutSets).where(condition);
      res.status(200).json({ success: true });
      return;
    }

    const add = input as z.output<typeof addSchema>;
    let exerciseId: number | null = null;
    let exerciseName = add.exerciseName?.trim() ?? "";
    if (add.exerciseId !== undefined) {
      const [profile] = await db
        .select({
          equipment: schema.users.equipment,
          experience: schema.users.experience,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
      const [exercise] = await db
        .select({
          id: schema.exercises.id,
          name: schema.exercises.name,
          equipment: schema.exercises.equipment,
          level: schema.exercises.difficulty,
          muscles: schema.exercises.muscles,
        })
        .from(schema.exercises)
        .where(
          and(
            eq(schema.exercises.id, add.exerciseId),
            eq(schema.exercises.isPublished, true),
          ),
        )
        .limit(1);
      if (
        !exercise ||
        !profile ||
        !filterPlanExercises(
          [exercise],
          profile.equipment ?? "gym",
          profile.experience ?? "beginner",
        ).length
      ) {
        sendError(
          res,
          400,
          "EXERCISE_UNAVAILABLE",
          "Choose an exercise from your available library.",
        );
        return;
      }
      exerciseId = exercise.id;
      exerciseName = exercise.name;
    }
    const [duplicate] = await db
      .select({ id: schema.workoutSets.id })
      .from(schema.workoutSets)
      .where(
        and(
          eq(schema.workoutSets.workoutId, workoutId),
          eq(schema.workoutSets.userId, userId),
          eq(schema.workoutSets.exerciseName, exerciseName),
        ),
      )
      .limit(1);
    if (duplicate) {
      sendError(
        res,
        409,
        "EXERCISE_ALREADY_ADDED",
        "That exercise is already in this workout.",
      );
      return;
    }
    const [placeholder] = await db
      .insert(schema.workoutSets)
      .values({
        workoutId,
        userId,
        exerciseId,
        exerciseName,
        setNumber: 0,
        reps: 0,
        weightKg: null,
      })
      .returning({ id: schema.workoutSets.id });
    res
      .status(201)
      .json({ success: true, id: placeholder?.id, exerciseId, exerciseName });
  } catch {
    sendError(
      res,
      500,
      "EXERCISE_UPDATE_FAILED",
      "Unable to update this workout.",
    );
  }
}
