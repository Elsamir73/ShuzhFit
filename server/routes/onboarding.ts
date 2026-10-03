import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../lib/http";
import { generateProgramDays } from "../../shared/program";
import { calculateFitnessMetrics } from "../../shared/fitness";

const onboardingSchema = z.object({
  goal: z.enum(["fat_loss", "maintain", "muscle_gain"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(2).max(6),
  equipment: z.enum(["gym", "home_dumbbells", "bodyweight"]),
  ageYears: z.number().int().min(13).max(100),
  sex: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(350),
  targetWeightKg: z.number().min(30).max(350),
  activityLevel: z.number().min(1.1).max(2.4).default(1.55),
});

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const input = parseBody(onboardingSchema, req.body);
  if (!input) {
    sendError(res, 400, "INVALID_INPUT", "Please complete all onboarding fields with valid values.");
    return;
  }
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const [{ db }, schema] = await Promise.all([import("../../db"), import("../../db/schema")]);
    const [exerciseRows] = await Promise.all([
      db.select({ id: schema.exercises.id, name: schema.exercises.name, equipment: schema.exercises.equipment, level: schema.exercises.difficulty, muscles: schema.exercises.muscles })
        .from(schema.exercises).where(eq(schema.exercises.isPublished, true)),
    ]);
    const generated = generateProgramDays(exerciseRows, input);
    const userId = Number(user.id);
    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    await db.update(schema.users).set({
      goalType: input.goal,
      experience: input.experience,
      daysPerWeek: input.daysPerWeek,
      weeklyWorkoutTarget: input.daysPerWeek,
      equipment: input.equipment,
      equipmentPreference: input.equipment,
      ageYears: input.ageYears,
      sex: input.sex,
      heightCm: Math.round(input.heightCm),
      targetWeightKg: String(input.targetWeightKg),
      activityLevel: String(input.activityLevel),
    }).where(eq(schema.users.id, userId));

    await db.insert(schema.progressEntries).values({
      userId,
      date: todayDate,
      weightKg: String(input.weightKg),
      goal: input.goal,
      notes: "Starting weight from onboarding",
    });

    await db.update(schema.programs).set({ isActive: false }).where(and(
      eq(schema.programs.userId, userId), eq(schema.programs.isActive, true),
    ));
    const [program] = await db.insert(schema.programs).values({
      userId,
      name: "Your weekly plan",
      split: generated.split,
      isActive: true,
    }).returning({ id: schema.programs.id });
    if (!program) throw new Error("Could not save the training plan.");

    for (const day of generated.days) {
      const [programDay] = await db.insert(schema.programDays).values({
        programId: program.id,
        dayIndex: day.dayIndex,
        name: day.name,
        weekday: day.weekday,
      }).returning({ id: schema.programDays.id });
      if (!programDay) throw new Error("Could not save a training day.");
      await db.insert(schema.programDayExercises).values(day.exercises.map((exercise) => ({
        programDayId: programDay.id,
        exerciseId: exercise.id,
        position: exercise.position,
        targetSets: exercise.targetSets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
      })));
    }

    await db.update(schema.users).set({ onboardedAt: new Date() }).where(eq(schema.users.id, userId));

    const metrics = calculateFitnessMetrics({ ...input, goal: input.goal });
    res.status(200).json({ success: true, split: generated.split, days: generated.days.length, metrics });
  } catch (error) {
    const insufficientExercises = error instanceof Error && error.message.startsWith("At least four exercises");
    sendError(res, insufficientExercises ? 422 : 500, insufficientExercises ? "PLAN_UNAVAILABLE" : "ONBOARDING_FAILED", insufficientExercises ? "There are not enough library exercises for this equipment choice yet." : "Unable to save onboarding right now.");
  }
}
