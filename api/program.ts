import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { filterPlanExercises, generateProgramDays } from "../shared/program";
import { requireAuth, parseBody, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "./_lib/http";

const updateSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("regenerate") }),
  z.object({ type: z.literal("reschedule"), dayId: z.number().int().positive(), weekday: z.number().int().min(0).max(6).nullable() }),
  z.object({ type: z.literal("swap"), dayId: z.number().int().positive(), position: z.number().int().min(0).max(10), exerciseId: z.number().int().positive() }),
]);

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "PATCH") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (req.method === "PATCH" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const user = await requireAuth(req, res);
  if (!user) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../db"), import("../db/schema")]);
    const userId = Number(user.id);
    const [program] = await db.select().from(schema.programs).where(and(eq(schema.programs.userId, userId), eq(schema.programs.isActive, true))).limit(1);
    if (!program) {
      sendError(res, 404, "PROGRAM_NOT_FOUND", "Complete onboarding to create your weekly plan.");
      return;
    }
    if (req.method === "PATCH") {
      const input = parseBody(updateSchema, req.body);
      if (!input) {
        sendError(res, 400, "INVALID_INPUT", "The plan change is invalid.");
        return;
      }
      if (input.type === "regenerate") {
        const [profile] = await db.select({ daysPerWeek: schema.users.daysPerWeek, equipment: schema.users.equipment, experience: schema.users.experience }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        if (!profile) { sendError(res, 404, "PROFILE_NOT_FOUND", "Profile not found."); return; }
        const candidates = await db.select({ id: schema.exercises.id, name: schema.exercises.name, equipment: schema.exercises.equipment, level: schema.exercises.difficulty, muscles: schema.exercises.muscles }).from(schema.exercises).where(eq(schema.exercises.isPublished, true));
        let generated;
        try { generated = generateProgramDays(candidates, { daysPerWeek: profile.daysPerWeek ?? 3, equipment: profile.equipment ?? "gym", experience: profile.experience ?? "beginner" }); }
        catch { sendError(res, 422, "PLAN_UNAVAILABLE", "There are not enough exercises for these preferences."); return; }
        const [nextProgram] = await db.insert(schema.programs).values({ userId, name: "Your weekly plan", split: generated.split, isActive: true }).returning({ id: schema.programs.id });
        if (!nextProgram) { sendError(res, 500, "PLAN_SAVE_FAILED", "Could not create your plan."); return; }
        for (const day of generated.days) {
          const [nextDay] = await db.insert(schema.programDays).values({ programId: nextProgram.id, dayIndex: day.dayIndex, name: day.name, weekday: day.weekday }).returning({ id: schema.programDays.id });
          if (nextDay) await db.insert(schema.programDayExercises).values(day.exercises.map((exercise) => ({ programDayId: nextDay.id, exerciseId: exercise.id, position: exercise.position, targetSets: exercise.targetSets, repMin: exercise.repMin, repMax: exercise.repMax })));
        }
        await db.update(schema.programs).set({ isActive: false }).where(and(eq(schema.programs.userId, userId), eq(schema.programs.isActive, true), eq(schema.programs.id, program.id)));
        res.status(200).json({ success: true, split: generated.split }); return;
      }
      const [ownedDay] = await db.select({ id: schema.programDays.id }).from(schema.programDays)
        .where(and(eq(schema.programDays.id, input.dayId), eq(schema.programDays.programId, program.id))).limit(1);
      if (!ownedDay) {
        sendError(res, 404, "DAY_NOT_FOUND", "That day does not belong to your active plan.");
        return;
      }
      if (input.type === "reschedule") {
        await db.update(schema.programDays).set({ weekday: input.weekday }).where(eq(schema.programDays.id, input.dayId));
      } else {
        const [profile] = await db.select({ equipment: schema.users.equipment, experience: schema.users.experience })
          .from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        const [exercise] = await db.select({ id: schema.exercises.id, name: schema.exercises.name, equipment: schema.exercises.equipment, level: schema.exercises.difficulty, muscles: schema.exercises.muscles })
          .from(schema.exercises).where(and(eq(schema.exercises.id, input.exerciseId), eq(schema.exercises.isPublished, true))).limit(1);
        if (!profile || !exercise || !filterPlanExercises([exercise], profile.equipment ?? "gym", profile.experience ?? "beginner").length) {
          sendError(res, 400, "EXERCISE_UNAVAILABLE", "Choose an exercise that matches your equipment and experience level.");
          return;
        }
        const [existing] = await db.select({ id: schema.programDayExercises.id }).from(schema.programDayExercises)
          .where(and(eq(schema.programDayExercises.programDayId, input.dayId), eq(schema.programDayExercises.position, input.position))).limit(1);
        if (!existing) {
          sendError(res, 404, "EXERCISE_SLOT_NOT_FOUND", "That exercise slot no longer exists.");
          return;
        }
        await db.update(schema.programDayExercises).set({ exerciseId: exercise.id }).where(eq(schema.programDayExercises.id, existing.id));
      }
      res.status(200).json({ success: true });
      return;
    }

    const days = await db.select().from(schema.programDays).where(eq(schema.programDays.programId, program.id)).orderBy(asc(schema.programDays.dayIndex));
    const planDays = await Promise.all(days.map(async (day) => {
      const exercises = await db.select({ id: schema.exercises.id, name: schema.exercises.name, muscles: schema.exercises.muscles, equipment: schema.exercises.equipment, position: schema.programDayExercises.position, targetSets: schema.programDayExercises.targetSets, repMin: schema.programDayExercises.repMin, repMax: schema.programDayExercises.repMax })
        .from(schema.programDayExercises).innerJoin(schema.exercises, eq(schema.programDayExercises.exerciseId, schema.exercises.id))
        .where(eq(schema.programDayExercises.programDayId, day.id)).orderBy(asc(schema.programDayExercises.position));
      return { ...day, exercises };
    }));
    const [profile] = await db.select({ equipment: schema.users.equipment, experience: schema.users.experience })
      .from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    const allExercises = await db.select({ id: schema.exercises.id, name: schema.exercises.name, equipment: schema.exercises.equipment, level: schema.exercises.difficulty, muscles: schema.exercises.muscles }).from(schema.exercises)
      .where(eq(schema.exercises.isPublished, true));
    const swapOptions = profile ? filterPlanExercises(allExercises, profile.equipment ?? "gym", profile.experience ?? "beginner") : [];
    res.status(200).json({ program: { id: program.id, name: program.name, split: program.split }, days: planDays, swapOptions });
  } catch {
    sendError(res, 500, "PROGRAM_FAILED", "Unable to load or update your weekly plan.");
  }
}
