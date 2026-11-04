import { and, count, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { countMissedPlannedSessions } from "../../lib/insights.js";
import { isMailerConfigured, sendMail } from "../../lib/mailer.js";
import { getDailyEmailLimit, getFollowupBatchSize, getRemainingRecipientCount } from "../../lib/followupCampaign.js";
import { createUnsubscribeToken, getFollowupButtonUrl, renderFollowupEmail } from "../../lib/followupEmail.js";
import { filterFollowupSegment, getDaysAway, type FollowupCandidate } from "../../lib/segments.js";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";
import { requireServerEnv } from "../../lib/env.js";

const segments = ["inactive_7d", "no_food_7d", "missed_workouts", "not_onboarded", "unverified"] as const;
const messageSchema = z.object({
  segment: z.enum(segments),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(10000),
  buttonLabel: z.string().trim().min(1).max(100),
  buttonPath: z.string().trim().min(1).max(500),
});
const sendSchema = messageSchema.extend({ campaignId: z.number().int().positive().optional() });
const oneDayMs = 24 * 60 * 60 * 1000;

function getAppUrl(): string {
  const value = process.env.APP_URL?.trim();
  if (!value) throw new Error("APP_URL is not configured.");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("APP_URL must use HTTP or HTTPS.");
  return parsed.origin;
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function loadCandidates(now: Date): Promise<FollowupCandidate[]> {
  const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
  const cutoffDate = dateOnly(now);
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 6);
  const recentFollowupAt = new Date(now.getTime() - 7 * oneDayMs);
  const [users, recentSends, foodLogs, activeProgramDays, finishedWorkouts, quickLogs] = await Promise.all([
    db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      emailOptOutAt: schema.users.emailOptOutAt,
      onboardedAt: schema.users.onboardedAt,
      lastLoginAt: schema.users.lastLoginAt,
    }).from(schema.users),
    db.select({ userId: schema.emailSends.userId, sentAt: schema.emailSends.sentAt })
      .from(schema.emailSends)
      .where(and(eq(schema.emailSends.status, "sent"), gte(schema.emailSends.sentAt, recentFollowupAt))),
    db.select({ userId: schema.foodLogs.userId, logDate: schema.foodLogs.logDate })
      .from(schema.foodLogs).where(gte(schema.foodLogs.logDate, cutoffDate)),
    db.select({
      userId: schema.programs.userId,
      createdAt: schema.programs.createdAt,
      weekday: schema.programDays.weekday,
    }).from(schema.programs)
      .innerJoin(schema.programDays, eq(schema.programDays.programId, schema.programs.id))
      .where(and(eq(schema.programs.isActive, true), isNotNull(schema.programDays.weekday))),
    db.select({ userId: schema.workouts.userId, workoutDate: schema.workouts.workoutDate })
      .from(schema.workouts)
      .where(and(eq(schema.workouts.status, "finished"), gte(schema.workouts.workoutDate, cutoffDate))),
    db.select({ userId: schema.workoutLogs.userId, logDate: schema.workoutLogs.logDate })
      .from(schema.workoutLogs).where(gte(schema.workoutLogs.logDate, cutoffDate)),
  ]);

  const lastFollowups = new Map<number, Date>();
  for (const row of recentSends) {
    const previous = lastFollowups.get(row.userId);
    if (!previous || row.sentAt > previous) lastFollowups.set(row.userId, row.sentAt);
  }
  const recentFoodUsers = new Set(foodLogs.map((row) => row.userId));
  const programs = new Map<number, { createdAt: Date; weekdays: number[] }>();
  for (const row of activeProgramDays) {
    const current = programs.get(row.userId);
    if (!current || row.createdAt > current.createdAt) {
      programs.set(row.userId, { createdAt: row.createdAt, weekdays: row.weekday === null ? [] : [row.weekday] });
    } else if (row.createdAt.getTime() === current.createdAt.getTime() && row.weekday !== null) {
      current.weekdays.push(row.weekday);
    }
  }
  const activities = new Map<number, Set<string>>();
  for (const row of [...finishedWorkouts.map((item) => ({ userId: item.userId, date: item.workoutDate })), ...quickLogs.map((item) => ({ userId: item.userId, date: item.logDate }))]) {
    const dates = activities.get(row.userId) ?? new Set<string>();
    dates.add(row.date.toISOString().slice(0, 10));
    activities.set(row.userId, dates);
  }
  const today = dateOnly(now);
  return users.map((user) => {
    const plan = programs.get(user.id);
    const missedCount = plan ? countMissedPlannedSessions({
      plannedWeekdays: plan.weekdays,
      activityDates: [...(activities.get(user.id) ?? new Set<string>())],
      planCreatedAt: plan.createdAt,
      today,
      lookbackDays: 7,
    }) : 0;
    return {
      ...user,
      lastFollowupAt: lastFollowups.get(user.id) ?? null,
      hasRecentFoodLog: recentFoodUsers.has(user.id),
      missedCount,
    };
  });
}

function getUnsubscribeUrl(userId: number, appUrl: string): string {
  const token = createUnsubscribeToken(userId, requireServerEnv("JWT_SECRET"));
  return `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function smtpReady(res: ApiResponse): boolean {
  if (isMailerConfigured()) return true;
  sendError(res, 503, "EMAIL_NOT_CONFIGURED", "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.");
  return false;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateButtonPath(path: string): boolean {
  try {
    getFollowupButtonUrl(getAppUrl(), path);
    return true;
  } catch {
    return false;
  }
}

export async function getSegments(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const candidates = await loadCandidates(new Date());
    const now = new Date();
    res.status(200).json(segments.map((segment) => ({
      segment,
      count: filterFollowupSegment(candidates, segment, now).length,
    })));
  } catch (error) {
    console.error("Unable to load follow-up segments:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "FOLLOWUP_SEGMENTS_FAILED", "Unable to load follow-up audiences.");
  }
}

export async function preview(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const input = parseBody(messageSchema, req.body);
  if (!input || !validateButtonPath(input.buttonPath)) {
    sendError(res, 400, "INVALID_INPUT", "Enter a valid message and a same-origin button path.");
    return;
  }
  try {
    const now = new Date();
    const candidates = filterFollowupSegment(await loadCandidates(now), input.segment, now);
    const sample: FollowupCandidate = candidates[0] ?? {
      id: Number(admin.id),
      name: admin.name || "Samir",
      email: admin.email,
      role: "user",
      createdAt: now,
      emailVerifiedAt: now,
      emailOptOutAt: null,
      onboardedAt: now,
      lastLoginAt: new Date(now.getTime() - 10 * oneDayMs),
      lastFollowupAt: null,
      hasRecentFoodLog: false,
      missedCount: 2,
    };
    const appUrl = getAppUrl();
    const rendered = renderFollowupEmail(input, sample, appUrl, `${appUrl}/unsubscribe?token=preview`, getDaysAway(sample, now));
    res.status(200).json({ ...rendered, count: candidates.length });
  } catch (error) {
    console.error("Unable to render follow-up preview:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "FOLLOWUP_PREVIEW_FAILED", "Unable to render the message preview.");
  }
}

export async function testMessage(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (!smtpReady(res)) return;
  const input = parseBody(messageSchema, req.body);
  if (!input || !validateButtonPath(input.buttonPath)) {
    sendError(res, 400, "INVALID_INPUT", "Enter a valid message and a same-origin button path.");
    return;
  }
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const adminId = Number(admin.id);
    const [row] = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      emailOptOutAt: schema.users.emailOptOutAt,
      onboardedAt: schema.users.onboardedAt,
      lastLoginAt: schema.users.lastLoginAt,
    }).from(schema.users).where(eq(schema.users.id, adminId)).limit(1);
    if (!row) { sendError(res, 404, "ADMIN_NOT_FOUND", "Your admin account could not be found."); return; }
    const now = new Date();
    const candidate: FollowupCandidate = { ...row, lastFollowupAt: null, hasRecentFoodLog: false, missedCount: 2 };
    const appUrl = getAppUrl();
    const unsubscribeUrl = getUnsubscribeUrl(candidate.id, appUrl);
    const rendered = renderFollowupEmail(input, candidate, appUrl, unsubscribeUrl, getDaysAway(candidate, now));
    const sent = await sendMail({
      to: candidate.email,
      ...rendered,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (!sent) { sendError(res, 502, "TEST_EMAIL_FAILED", "The test email could not be sent. Check SMTP configuration and server logs."); return; }
    res.status(200).json({ sent: true, to: candidate.email });
  } catch (error) {
    console.error("Unable to send follow-up test:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "FOLLOWUP_TEST_FAILED", "Unable to send the test email.");
  }
}

export async function sendCampaignBatch(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  if (!smtpReady(res)) return;
  const input = parseBody(sendSchema, req.body);
  if (!input || !validateButtonPath(input.buttonPath)) {
    sendError(res, 400, "INVALID_INPUT", "Enter a valid message and a same-origin button path.");
    return;
  }
  try {
    const dailyLimit = getDailyEmailLimit(process.env.EMAIL_DAILY_LIMIT);
    const now = new Date();
    const candidates = filterFollowupSegment(await loadCandidates(now), input.segment, now);
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    let campaignId = input.campaignId;
    if (campaignId === undefined) {
      const sentTodayRows = await db.select({ value: count() }).from(schema.emailSends)
        .where(and(eq(schema.emailSends.status, "sent"), gte(schema.emailSends.sentAt, startOfUtcDay(now))));
      const currentCap = getFollowupBatchSize(candidates.length, Number(sentTodayRows[0]?.value ?? 0), dailyLimit);
      if (currentCap.limitReached) { sendError(res, 429, "DAILY_EMAIL_LIMIT", `Daily email limit reached (${dailyLimit}). Try again after the UTC day resets.`); return; }
      const [created] = await db.insert(schema.emailCampaigns).values({
        name: input.subject.slice(0, 160),
        subject: input.subject,
        body: input.body,
        segment: input.segment,
        createdBy: Number(admin.id),
      }).returning({ id: schema.emailCampaigns.id });
      if (!created) throw new Error("Campaign could not be created.");
      campaignId = created.id;
    } else {
      const [campaign] = await db.select().from(schema.emailCampaigns).where(eq(schema.emailCampaigns.id, campaignId)).limit(1);
      if (!campaign || campaign.segment !== input.segment || campaign.subject !== input.subject || campaign.body !== input.body) {
        sendError(res, 400, "CAMPAIGN_MISMATCH", "This batch does not match the saved campaign.");
        return;
      }
    }

    const existing = await db.select({ userId: schema.emailSends.userId })
      .from(schema.emailSends).where(eq(schema.emailSends.campaignId, campaignId));
    const attempted = new Set(existing.map((row) => row.userId));
    const pending = candidates.filter((candidate) => !attempted.has(candidate.id));
    const sentTodayRows = await db.select({ value: count() }).from(schema.emailSends)
      .where(and(eq(schema.emailSends.status, "sent"), gte(schema.emailSends.sentAt, startOfUtcDay(now))));
    const batch = getFollowupBatchSize(pending.length, Number(sentTodayRows[0]?.value ?? 0), dailyLimit);
    if (batch.limitReached) {
      sendError(res, 429, "DAILY_EMAIL_LIMIT", `Daily email limit reached (${dailyLimit}). ${pending.length} recipient(s) remain; try again after the UTC day resets.`);
      return;
    }
    const toSend = pending.slice(0, batch.batchSize);
    const failures: Array<{ name: string; email: string; error: string }> = [];
    let sent = 0;
    for (let index = 0; index < toSend.length; index += 1) {
      const candidate = toSend[index]!;
      const [currentUser] = await db.select({ role: schema.users.role, emailOptOutAt: schema.users.emailOptOutAt })
        .from(schema.users).where(eq(schema.users.id, candidate.id)).limit(1);
      if (!currentUser || currentUser.role === "admin" || currentUser.emailOptOutAt) {
        await db.insert(schema.emailSends).values({
          campaignId,
          userId: candidate.id,
          status: "skipped",
          error: "Recipient is no longer eligible.",
        }).onConflictDoNothing();
      } else {
        const appUrl = getAppUrl();
        const unsubscribeUrl = getUnsubscribeUrl(candidate.id, appUrl);
        const rendered = renderFollowupEmail(input, candidate, appUrl, unsubscribeUrl, getDaysAway(candidate, now));
        const delivered = await sendMail({
          to: candidate.email,
          ...rendered,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        const status = delivered ? "sent" : "failed";
        const error = delivered ? null : "SMTP delivery failed.";
        await db.insert(schema.emailSends).values({ campaignId, userId: candidate.id, status, error })
          .onConflictDoNothing();
        if (delivered) sent += 1;
        else failures.push({ name: candidate.name, email: candidate.email, error: error ?? "Delivery failed." });
      }
      if (index < toSend.length - 1) await delay(300);
    }
    res.status(200).json({
      campaignId,
      sent,
      failed: failures.length,
      remaining: getRemainingRecipientCount(pending.length, toSend.length),
      failures,
    });
  } catch (error) {
    console.error("Unable to send follow-up campaign batch:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.message.includes("EMAIL_DAILY_LIMIT")) {
      sendError(res, 500, "FOLLOWUP_CONFIGURATION", error.message);
      return;
    }
    sendError(res, 500, "FOLLOWUP_SEND_FAILED", "Unable to process the follow-up batch.");
  }
}

export async function history(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const campaigns = await db.select().from(schema.emailCampaigns).orderBy(desc(schema.emailCampaigns.createdAt)).limit(20);
    const campaignIds = campaigns.map((campaign) => campaign.id);
    const sends = campaignIds.length
      ? await db.select({ campaignId: schema.emailSends.campaignId, status: schema.emailSends.status, total: count() })
        .from(schema.emailSends).where(inArray(schema.emailSends.campaignId, campaignIds))
        .groupBy(schema.emailSends.campaignId, schema.emailSends.status)
      : [];
    res.status(200).json(campaigns.map((campaign) => {
      const counts = sends.filter((item) => item.campaignId === campaign.id);
      return {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        segment: campaign.segment,
        createdAt: campaign.createdAt.toISOString(),
        sent: Number(counts.find((item) => item.status === "sent")?.total ?? 0),
        failed: Number(counts.find((item) => item.status === "failed")?.total ?? 0),
      };
    }));
  } catch (error) {
    console.error("Unable to load follow-up campaign history:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "FOLLOWUP_HISTORY_FAILED", "Unable to load campaign history.");
  }
}

export async function unsubscribe(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  const token = typeof req.query?.token === "string" ? req.query.token : "";
  const action = typeof req.query?.action === "string" ? req.query.action : "unsubscribe";
  const userId = (await import("../../lib/followupEmail.js")).verifyUnsubscribeToken(token, requireServerEnv("JWT_SECRET"));
  if (userId === null || (action !== "unsubscribe" && action !== "subscribe")) {
    sendError(res, 400, "INVALID_UNSUBSCRIBE_TOKEN", "This email preference link is invalid or has expired.");
    return;
  }
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    await db.update(schema.users).set({ emailOptOutAt: action === "unsubscribe" ? new Date() : null })
      .where(eq(schema.users.id, userId));
    if (req.method === "POST") {
      res.status(200).json({ success: true, subscribed: action === "subscribe" });
      return;
    }
    res.status(200).json({ success: true, subscribed: action === "subscribe" });
  } catch (error) {
    console.error("Unable to update follow-up subscription:", error instanceof Error ? error.message : String(error));
    sendError(res, 500, "UNSUBSCRIBE_FAILED", "Unable to update email preferences.");
  }
}
