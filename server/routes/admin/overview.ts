import { count, desc, gte, sql } from "drizzle-orm";
import { requireAdmin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (!await requireAdmin(req, res)) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const now = new Date();
    const week = new Date(now.getTime() - 7 * 86400000);
    const month = new Date(now.getTime() - 30 * 86400000);
    const [[total], [newWeek], [newMonth], [workoutCount], [published], [unread], [onboarded], signups, goals, recentSignups, popularExercises] = await Promise.all([
      db.select({ value: count() }).from(schema.users),
      db.select({ value: count() }).from(schema.users).where(gte(schema.users.createdAt, week)),
      db.select({ value: count() }).from(schema.users).where(gte(schema.users.createdAt, month)),
      db.select({ value: count() }).from(schema.workouts).where(sql`${schema.workouts.status} = 'completed'`),
      db.select({ value: count() }).from(schema.blogs).where(sql`${schema.blogs.isPublished} = true AND ${schema.blogs.status} = 'published'`),
      db.select({ value: count() }).from(schema.contacts).where(sql`${schema.contacts.isRead} = false`),
      db.select({ value: count() }).from(schema.users).where(sql`${schema.users.onboardedAt} IS NOT NULL`),
      db.select({ day: sql<string>`to_char(${schema.users.createdAt}, 'YYYY-MM-DD')`, total: count() }).from(schema.users).where(gte(schema.users.createdAt, month)).groupBy(sql`to_char(${schema.users.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`to_char(${schema.users.createdAt}, 'YYYY-MM-DD')`),
      db.select({ goal: schema.users.goalType, total: count() }).from(schema.users).groupBy(schema.users.goalType),
      db.select({ name: schema.users.name, email: schema.users.email, joined: schema.users.createdAt }).from(schema.users).orderBy(desc(schema.users.createdAt)).limit(10),
      db.select({ exercise: schema.workoutLogs.exerciseName, total: count() }).from(schema.workoutLogs).groupBy(schema.workoutLogs.exerciseName).orderBy(desc(count())).limit(5),
    ]);
    const activeRows = await Promise.all([
      db.select({ id: schema.workouts.userId }).from(schema.workouts).where(gte(schema.workouts.createdAt, week)),
      db.select({ id: schema.workoutLogs.userId }).from(schema.workoutLogs).where(gte(schema.workoutLogs.createdAt, week)),
      db.select({ id: schema.foodLogs.userId }).from(schema.foodLogs).where(gte(schema.foodLogs.createdAt, week)),
      db.select({ id: schema.progressEntries.userId }).from(schema.progressEntries).where(gte(schema.progressEntries.createdAt, week)),
      db.select({ id: schema.waterLogs.userId }).from(schema.waterLogs).where(gte(schema.waterLogs.createdAt, week)),
    ]);
    const activeUsers = new Set(activeRows.flatMap((rows) => rows.map((row) => row.id)));
    const totalMembers = Number(total?.value ?? 0);
    res.status(200).json({ totalMembers, newThisWeek: Number(newWeek?.value ?? 0), newThisMonth: Number(newMonth?.value ?? 0), activeLast7Days: activeUsers.size, workoutsLogged: Number(workoutCount?.value ?? 0), publishedBlogs: Number(published?.value ?? 0), unreadMessages: Number(unread?.value ?? 0), onboardingCompletionPct: totalMembers ? Math.round(Number(onboarded?.value ?? 0) / totalMembers * 100) : 0, signupsByDay: signups.map((item) => ({ day: item.day, total: Number(item.total) })), membersByGoal: goals.map((item) => ({ goal: item.goal ?? "Not set", total: Number(item.total) })), recentSignups: recentSignups.map((item) => ({ name: item.name, email: item.email, joined: item.joined.toISOString() })), popularExercises: popularExercises.map((item) => ({ name: item.exercise, total: Number(item.total) })) });
  } catch { sendError(res, 500, "ADMIN_OVERVIEW_FAILED", "Unable to load admin overview."); }
}
