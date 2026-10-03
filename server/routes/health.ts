import { count, sql } from "drizzle-orm";
import { isEnvSet, requireServerEnv } from "../lib/env";
import type { ApiRequest, ApiResponse } from "../lib/http";

export default async function handler(_req: ApiRequest, res: ApiResponse): Promise<void> {
  let dbReady = false;
  let usersTable = false;
  let exercisesCount = 0;

  try {
    requireServerEnv("DATABASE_URL");
    const [{ db }, schema] = await Promise.all([import("../../db"), import("../../db/schema")]);
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

  res.status(200).json({
    db: dbReady,
    usersTable,
    exercisesCount,
    jwtSecretSet: isEnvSet("JWT_SECRET"),
    youtubeKeySet: isEnvSet("YOUTUBE_API_KEY"),
    youtubeChannelIdSet: isEnvSet("YOUTUBE_CHANNEL_ID"),
  });
}
