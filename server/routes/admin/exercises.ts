import { desc, notInArray } from "drizzle-orm";
import { z } from "zod";
import { parseBody, requireAdmin, requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

const exerciseInput = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180), name: z.string().trim().min(1).max(200), category: z.string().max(120),
  muscles: z.string().max(1000), equipment: z.string().max(120), difficulty: z.string().max(60), description: z.string().max(5000), benefits: z.string().max(10000),
  formGuide: z.string().max(10000), mistakes: z.string().max(10000), muscleGroup: z.enum(["chest", "back", "legs", "shoulders", "arms", "core", "full_body"]).optional(),
  steps: z.array(z.string().trim().min(1).max(500)).max(7).default([]), tips: z.array(z.string().trim().min(1).max(500)).max(3).default([]),
  mistakesList: z.array(z.string().trim().min(1).max(500)).max(4).default([]), repUnit: z.enum(["reps", "seconds", "meters"]).default("reps"),
  youtubeUrl: z.string().max(500).optional().default(""), imageUrl: z.string().url().max(2048).nullable().optional(),
}).refine((item) => item.steps.length >= 3, { message: "Published exercises need at least three steps." });
const inputSchema = z.array(exerciseInput).max(500);
const clean = (value: string) => value.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "").replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "$1=\"#\"");
function videoId(value: string): string | null {
  try { const url = new URL(value); if (!/(^|\.)youtube\.com$/.test(url.hostname) && url.hostname !== "youtu.be") return null; return url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? null; } catch { return null; }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") { sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed."); return; }
  if (req.method === "POST" && (!requireOrigin(req, res) || !requireJson(req, res))) return;
  if (!await requireAdmin(req, res)) return;
  try {
    const [{ db }, { exercises }] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    if (req.method === "GET") {
      const rows = await db.select().from(exercises).orderBy(desc(exercises.createdAt));
      res.status(200).json(rows.map((row) => ({ slug: row.slug, name: row.name, category: row.category ?? "General", muscles: row.muscles ?? "", equipment: row.equipment ?? "", difficulty: row.difficulty ?? "Beginner", description: row.description ?? "", benefits: row.benefits ?? "", formGuide: row.formGuide ?? "", mistakes: row.mistakes ?? "", youtubeUrl: row.youtubeUrl ?? "", muscleGroup: row.muscleGroup ?? "full_body", steps: row.steps ?? [], tips: row.tips ?? [], mistakesList: row.mistakesList ?? [], repUnit: row.repUnit, imageUrl: row.imageUrl ?? "" })));
      return;
    }
    const items = parseBody(inputSchema, req.body);
    if (!items) { sendError(res, 400, "INVALID_INPUT", "Exercises need valid details and at least three steps each."); return; }
    for (const item of items) {
      const youtubeVideoId = videoId(item.youtubeUrl ?? "");
      const values = { slug: item.slug, name: item.name, category: item.category, muscles: item.muscles, equipment: item.equipment, difficulty: item.difficulty, description: item.description, benefits: clean(item.benefits), formGuide: clean(item.formGuide), mistakes: clean(item.mistakes), youtubeUrl: youtubeVideoId ? item.youtubeUrl : null, youtubeVideoId, muscleGroup: item.muscleGroup ?? "full_body", steps: item.steps, tips: item.tips, mistakesList: item.mistakesList, repUnit: item.repUnit, imageUrl: item.imageUrl ?? null, isPublished: true };
      await db.insert(exercises).values(values).onConflictDoUpdate({ target: exercises.slug, set: { ...values, updatedAt: new Date() } });
    }
    if (items.length) await db.delete(exercises).where(notInArray(exercises.slug, items.map((item) => item.slug)));
    else await db.delete(exercises);
    res.status(200).json({ success: true });
  } catch (error) { console.error("Admin exercise save failed:", error instanceof Error ? error.message : String(error)); sendError(res, 500, "ADMIN_EXERCISES_FAILED", "Unable to save exercise content."); }
}
