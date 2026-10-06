import { count, sql } from "drizzle-orm";
import { isEnvSet, requireServerEnv } from "../lib/env.js";
import type { ApiRequest, ApiResponse } from "../lib/http.js";
import { header } from "../lib/http.js";
import { verifyAuthToken } from "../routes/auth/_helpers.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  const token = header(req, "cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("shuzhfit_session="))?.slice("shuzhfit_session=".length);
  let isAdmin = false;
  if (token) { try { isAdmin = (await verifyAuthToken(token)).role === "admin"; } catch { isAdmin = false; } }
  let dbReady = false;
  let usersTable = false;
  let exercisesCount = 0;

  try {
    requireServerEnv("DATABASE_URL");
    const [{ db }, schema] = await Promise.all([import("../../db/index.js"), import("../../db/schema.js")]);
    await db.execute(sql`select 1`);
    dbReady = true;
    try {
      await db.select({ id: schema.users.id }).from(schema.users).limit(1);
      usersTable = true;
    } catch {
      usersTable = false;
    }
    try {
      const [result] = await db.select({ total: count() }).from(schema.exercises);
      exercisesCount = Number(result?.total ?? 0);
    } catch {
      exercisesCount = 0;
    }
  } catch {
    dbReady = false;
  }

  if (!isAdmin) { res.status(200).json({ ok: dbReady }); return; }

  res.status(200).json({ ok: dbReady,
    db: dbReady,
    usersTable,
    exercisesCount,
    jwtSecretSet: isEnvSet("JWT_SECRET"),
    youtubeKeySet: isEnvSet("YOUTUBE_API_KEY"),
    youtubeChannelIdSet: isEnvSet("YOUTUBE_CHANNEL_ID"),
  });
}
