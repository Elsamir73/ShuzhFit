import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireJson, requireOrigin, parseBody, sendError, type ApiRequest, type ApiResponse } from "../lib/http.js";

const foodInput = z.object({ name: z.string().trim().min(1).max(200), calories: z.number().int().min(0).max(10000), proteinG: z.number().min(0).max(1000), carbsG: z.number().min(0).max(1000), fatG: z.number().min(0).max(1000), mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"), date: z.string().date() });
const queryValue = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method ?? "")) { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const auth = await requireAuth(req, res); if (!auth) return; const userId = Number(auth.id);
  try {
    const [{ db }, s] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    const dateText = queryValue(req.query?.date) ?? new Date().toISOString().slice(0, 10);
    const date = new Date(`${dateText}T00:00:00.000Z`); if (Number.isNaN(date.getTime())) { sendError(res, 400, "INVALID_DATE", "Use a valid date."); return; }
    if (req.method === "GET") {
      const [foods, water, saved, common, totals] = await Promise.all([
        db.select().from(s.foodLogs).where(and(eq(s.foodLogs.userId, userId), eq(s.foodLogs.logDate, date))).orderBy(asc(s.foodLogs.createdAt)),
        db.select().from(s.waterLogs).where(and(eq(s.waterLogs.userId, userId), eq(s.waterLogs.logDate, date))).limit(1),
        db.select().from(s.savedFoods).where(eq(s.savedFoods.userId, userId)).orderBy(desc(s.savedFoods.timesUsed), desc(s.savedFoods.lastUsedAt)).limit(12),
        db.select().from(s.commonFoods).orderBy(asc(s.commonFoods.name)),
        db.select({ date: s.foodLogs.logDate, calories: sql<number>`sum(${s.foodLogs.calories})` }).from(s.foodLogs).where(and(eq(s.foodLogs.userId, userId), gte(s.foodLogs.logDate, new Date(date.getTime() - 6 * 86400000)), lte(s.foodLogs.logDate, date))).groupBy(s.foodLogs.logDate).orderBy(asc(s.foodLogs.logDate)),
      ]);
      const [[profile], latestWeight] = await Promise.all([
        db.select().from(s.users).where(eq(s.users.id, userId)).limit(1),
        db.select({ weightKg: s.progressEntries.weightKg }).from(s.progressEntries).where(and(eq(s.progressEntries.userId, userId), sql`${s.progressEntries.weightKg} IS NOT NULL`)).orderBy(desc(s.progressEntries.date)).limit(1),
      ]);
      const calorieByDate = new Map(totals.map((item) => [item.date.toISOString().slice(0, 10), Number(item.calories ?? 0)]));
      const weeklyCalories = Array.from({ length: 7 }, (_, index) => { const day = new Date(date); day.setUTCDate(day.getUTCDate() - 6 + index); const key = day.toISOString().slice(0, 10); return { date: key, calories: calorieByDate.get(key) ?? 0 }; });
      res.status(200).json({ foods: foods.map((f) => ({ id: f.id, name: f.name, calories: f.calories, proteinG: Number(f.proteinG ?? 0), carbsG: Number(f.carbsG ?? 0), fatG: Number(f.fatG ?? 0), mealType: f.mealType ?? "snack" })), water: water[0]?.glasses ?? 0, savedFoods: saved.map((f) => ({ name: f.name, calories: f.calories, proteinG: Number(f.proteinG ?? 0), carbsG: Number(f.carbsG ?? 0), fatG: Number(f.fatG ?? 0) })), commonFoods: common.map((f) => ({ name: f.name, calories: f.calories, proteinG: Number(f.proteinG), carbsG: Number(f.carbsG), fatG: Number(f.fatG), estimate: f.isEstimate })), weeklyCalories, profile: profile ? { sex: profile.sex ?? "other", ageYears: profile.ageYears ?? 30, heightCm: profile.heightCm ?? 170, weightKg: Number(latestWeight[0]?.weightKg ?? 70), activityLevel: Number(profile.activityLevel ?? 1.55), goal: profile.goalType ?? "maintain" } : null }); return;
    }
    if (req.method === "POST") {
      const input = parseBody(foodInput, req.body); if (!input) { sendError(res, 400, "INVALID_INPUT", "Enter valid food and nutrition values."); return; }
      const logDate = new Date(`${input.date}T00:00:00.000Z`);
      const [row] = await db.insert(s.foodLogs).values({ userId, name: input.name, calories: input.calories, proteinG: String(input.proteinG), carbsG: String(input.carbsG), fatG: String(input.fatG), mealType: input.mealType, logDate }).returning();
      await db.insert(s.savedFoods).values({ userId, name: input.name, calories: input.calories, proteinG: String(input.proteinG), carbsG: String(input.carbsG), fatG: String(input.fatG), timesUsed: 1, lastUsedAt: new Date() }).onConflictDoUpdate({ target: [s.savedFoods.userId, s.savedFoods.name], set: { calories: input.calories, proteinG: String(input.proteinG), carbsG: String(input.carbsG), fatG: String(input.fatG), timesUsed: sql`${s.savedFoods.timesUsed} + 1`, lastUsedAt: new Date() } });
      res.status(201).json({ id: row?.id, name: input.name }); return;
    }
    if (req.method === "PATCH") {
      const body = parseBody(z.object({ glasses: z.number().int().min(0).max(100), date: z.string().date() }), req.body); if (!body) { sendError(res, 400, "INVALID_INPUT", "Enter a valid water amount."); return; }
      const logDate = new Date(`${body.date}T00:00:00.000Z`);
      await db.insert(s.waterLogs).values({ userId, logDate, glasses: body.glasses }).onConflictDoUpdate({ target: [s.waterLogs.userId, s.waterLogs.logDate], set: { glasses: body.glasses } }); res.status(200).json({ glasses: body.glasses }); return;
    }
    const id = Number(queryValue(req.query?.id)); if (!Number.isSafeInteger(id) || id < 1) { sendError(res, 400, "INVALID_ID", "A valid food entry is required."); return; }
    await db.delete(s.foodLogs).where(and(eq(s.foodLogs.id, id), eq(s.foodLogs.userId, userId))); res.status(200).json({ success: true });
  } catch { sendError(res, 500, "NUTRITION_FAILED", "Unable to load or save nutrition data."); }
}
