import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { toCsv } from "../../lib/csv.js";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const mutationSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("role"), userId: z.number().int().positive(), role: z.enum(["user", "admin"]) }), z.object({ action: z.literal("delete"), userId: z.number().int().positive(), confirmEmail: z.string().email() })]);
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (!(["GET", "PATCH", "DELETE"] as const).includes(req.method as "GET" | "PATCH" | "DELETE")) { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method !== "GET" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "PATCH" || req.method === "DELETE") {
      const input = parseBody(mutationSchema, req.body);
      if (!input || (req.method === "PATCH" && input.action !== "role") || (req.method === "DELETE" && input.action !== "delete")) { sendError(res, 400, "INVALID_INPUT", "The member change is invalid."); return; }
      if (String(input.userId) === admin.id) { sendError(res, 400, "SELF_CHANGE", "You cannot change or delete your own admin account."); return; }
      const [target] = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, input.userId)).limit(1);
      if (!target) { sendError(res, 404, "MEMBER_NOT_FOUND", "Member not found."); return; }
      if (input.action === "role") { await db.update(schema.users).set({ role: input.role }).where(eq(schema.users.id, target.id)); res.status(200).json({ success: true }); return; }
      if (target.email.toLowerCase() !== input.confirmEmail.toLowerCase()) { sendError(res, 400, "EMAIL_CONFIRMATION_MISMATCH", "Enter the member's email address to confirm deletion."); return; }
      await db.delete(schema.users).where(eq(schema.users.id, target.id));
      await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.email, target.email));
      res.status(200).json({ success: true }); return;
    }
    const detailId = Number(req.query?.id);
    if (req.query?.id && Number.isSafeInteger(detailId) && detailId > 0) {
      const [member] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, goal: schema.users.goalType, experience: schema.users.experience, heightCm: schema.users.heightCm, ageYears: schema.users.ageYears, daysPerWeek: schema.users.daysPerWeek, equipment: schema.users.equipment, joined: schema.users.createdAt, lastActive: schema.users.lastLoginAt, onboardedAt: schema.users.onboardedAt }).from(schema.users).where(eq(schema.users.id, detailId)).limit(1);
      if (!member) { sendError(res, 404, "MEMBER_NOT_FOUND", "Member not found."); return; }
      const [workoutCount] = await db.select({ value: count() }).from(schema.workouts).where(eq(schema.workouts.userId, detailId));
      const sessions = await db.select({ id: schema.workouts.id, name: schema.workouts.name, workoutDate: schema.workouts.workoutDate, status: schema.workouts.status }).from(schema.workouts).where(eq(schema.workouts.userId, detailId)).orderBy(desc(schema.workouts.workoutDate)).limit(5);
      res.status(200).json({ member: { ...member, id: String(member.id), joined: member.joined.toISOString(), lastActive: member.lastActive?.toISOString() ?? null, onboarded: Boolean(member.onboardedAt), workoutsCount: Number(workoutCount?.value ?? 0) }, sessions: sessions.map((session) => ({ ...session, id: String(session.id), workoutDate: session.workoutDate.toISOString() })) }); return;
    }
    const page = Math.max(1, Math.min(10000, Number(req.query?.page) || 1));
    const query = typeof req.query?.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const role = req.query?.role;
    const goal = req.query?.goal;
    const onboarded = req.query?.onboarded;
    const filters = [];
    if (query) filters.push(or(ilike(schema.users.name, `%${query.replace(/[\\%_]/g, "\\$&")}%`), ilike(schema.users.email, `%${query.replace(/[\\%_]/g, "\\$&")}%`))!);
    if (role === "admin" || role === "user") filters.push(eq(schema.users.role, role));
    if (typeof goal === "string" && goal) filters.push(eq(schema.users.goalType, goal));
    if (onboarded === "true") filters.push(sql`${schema.users.onboardedAt} IS NOT NULL`);
    if (onboarded === "false") filters.push(sql`${schema.users.onboardedAt} IS NULL`);
    const where = filters.length ? and(...filters) : undefined;
    const sort = req.query?.sort === "name" ? asc(schema.users.name) : req.query?.sort === "active" ? desc(schema.users.lastLoginAt) : desc(schema.users.createdAt);
    const [rows, [total]] = await Promise.all([db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, goal: schema.users.goalType, onboardedAt: schema.users.onboardedAt, joined: schema.users.createdAt, lastActive: schema.users.lastLoginAt }).from(schema.users).where(where).orderBy(sort).limit(20).offset((page - 1) * 20), db.select({ value: count() }).from(schema.users).where(where)]);
    if (req.query?.export === "csv") { res.status(200).json({ csv: toCsv(rows.map((row) => ({ name: row.name, email: row.email, joined: row.joined.toISOString(), goal: row.goal })), ["name", "email", "joined", "goal"]) }); return; }
    const memberRows = await Promise.all(rows.map(async (row) => { const [workouts] = await db.select({ value: count() }).from(schema.workouts).where(eq(schema.workouts.userId, row.id)); return { ...row, id: String(row.id), joined: row.joined.toISOString(), lastActive: row.lastActive?.toISOString() ?? null, onboarded: Boolean(row.onboardedAt), workoutsCount: Number(workouts?.value ?? 0) }; }));
    res.status(200).json({ members: memberRows, page, pageSize: 20, total: Number(total?.value ?? 0) });
  } catch { sendError(res, 500, "ADMIN_MEMBERS_FAILED", "Unable to load or update members."); }
}
