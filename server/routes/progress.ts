import { and, asc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, requireJson, requireOrigin, parseBody, sendError, type ApiRequest, type ApiResponse } from "../lib/http.js";

const value = (input: string | string[] | undefined) => Array.isArray(input) ? input[0] : input;
const measurement = z.object({ id: z.number().int().positive().optional(), date: z.string().date(), weightKg: z.number().min(1).max(500).optional().nullable(), waistCm: z.number().min(1).max(300).optional().nullable(), bodyFatPct: z.number().min(0).max(100).optional().nullable(), notes: z.string().max(2000).optional() });
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method ?? "")) { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const auth = await requireAuth(req, res); if (!auth) return; const userId = Number(auth.id);
  try {
    const [{ db }, s] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    if (req.method === "GET") {
      const since = new Date(); since.setUTCDate(since.getUTCDate() - 56);
      const [entries, workouts, quickLogs, sets, profile] = await Promise.all([
        db.select().from(s.progressEntries).where(eq(s.progressEntries.userId, userId)).orderBy(asc(s.progressEntries.date)),
        db.select({ workoutDate: s.workouts.workoutDate, finishedAt: s.workouts.finishedAt }).from(s.workouts).where(and(eq(s.workouts.userId, userId), eq(s.workouts.status, "finished"), gte(s.workouts.workoutDate, since))),
        db.select({ logDate: s.workoutLogs.logDate }).from(s.workoutLogs).where(and(eq(s.workoutLogs.userId, userId), gte(s.workoutLogs.logDate, since))),
        db.select({ exerciseName: s.workoutSets.exerciseName, weightKg: s.workoutSets.weightKg, reps: s.workoutSets.reps, isWarmup: s.workoutSets.isWarmup }).from(s.workoutSets).innerJoin(s.workouts, eq(s.workoutSets.workoutId, s.workouts.id)).where(and(eq(s.workoutSets.userId, userId), eq(s.workouts.status, "finished"))),
        db.select({ targetWeightKg: s.users.targetWeightKg }).from(s.users).where(eq(s.users.id, userId)).limit(1),
      ]);
      const weeks = Array.from({ length: 8 }, (_, index) => { const start = new Date(); start.setUTCHours(0,0,0,0); start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7) - (7 - index) * 7); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7); const dates = [...workouts.map((w) => w.workoutDate), ...quickLogs.map((w) => w.logDate)].filter((d) => d >= start && d < end); return { week: start.toISOString().slice(0,10), count: new Set(dates.map((d) => d.toISOString().slice(0,10))).size }; });
      const bests = new Map<string, number>(); for (const set of sets) if (!set.isWarmup) bests.set(set.exerciseName, Math.max(bests.get(set.exerciseName) ?? 0, Number(set.weightKg ?? 0) * (1 + set.reps / 30)));
      res.status(200).json({ entries: entries.map((e) => ({ id: e.id, date: e.date.toISOString().slice(0,10), weightKg: e.weightKg === null ? null : Number(e.weightKg), waistCm: e.waistCm === null ? null : Number(e.waistCm), bodyFatPct: e.bodyFatPct === null ? null : Number(e.bodyFatPct), notes: e.notes ?? "" })), goalWeightKg: Number(profile[0]?.targetWeightKg ?? 0), weeklyConsistency: weeks, personalRecords: [...bests].map(([exerciseName, estimated1Rm]) => ({ exerciseName, estimated1Rm: Number(estimated1Rm.toFixed(1)) })).sort((a,b) => b.estimated1Rm-a.estimated1Rm).slice(0,20) }); return;
    }
    if (req.method === "DELETE") { const id = Number(value(req.query?.id)); if (!Number.isSafeInteger(id) || id < 1) { sendError(res, 400, "INVALID_ID", "A valid measurement is required."); return; } await db.delete(s.progressEntries).where(and(eq(s.progressEntries.id,id),eq(s.progressEntries.userId,userId))); res.status(200).json({ success: true }); return; }
    const input = parseBody(measurement, req.body); if (!input) { sendError(res, 400, "INVALID_INPUT", "Enter a valid measurement."); return; }
    const logDate = new Date(`${input.date}T00:00:00.000Z`); const values = { userId, date: logDate, weightKg: input.weightKg == null ? null : String(input.weightKg), waistCm: input.waistCm == null ? null : String(input.waistCm), bodyFatPct: input.bodyFatPct == null ? null : String(input.bodyFatPct), notes: input.notes ?? null };
    const [row] = input.id ? await db.update(s.progressEntries).set(values).where(and(eq(s.progressEntries.id,input.id),eq(s.progressEntries.userId,userId))).returning() : await db.insert(s.progressEntries).values(values).returning();
    if (!row) { sendError(res, 404, "MEASUREMENT_NOT_FOUND", "Measurement not found."); return; } res.status(200).json({ id: row.id });
  } catch { sendError(res, 500, "PROGRESS_FAILED", "Unable to load or save progress."); }
}
