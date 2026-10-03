import { verifyAuthToken } from "../auth/_helpers";
import { demoTrackerStore, readBody } from "./_demo-store";

async function resolveSessionUser(req: any) {
  const cookie = req.headers.cookie ?? "";
  const token = cookie
    .split("; ")
    .find((part: string) => part.startsWith("shuzhfit_session="))
    ?.replace("shuzhfit_session=", "");

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const sessionUser = await resolveSessionUser(req);
  const connectionString = process.env.DATABASE_URL;

  if (req.method === "GET") {
    if (connectionString && sessionUser) {
      try {
        const { db } = await import("../../db");
        const { eq, desc } = await import("drizzle-orm");
        const schema = await import("../../db/schema");
        const userId = Number(sessionUser.id);
        if (!Number.isNaN(userId)) {
          const rows = await db
            .select()
            .from(schema.workoutLogs)
            .where(eq(schema.workoutLogs.userId, userId))
            .orderBy(desc(schema.workoutLogs.createdAt));

          return res.status(200).json(
            rows.map((row: any) => ({
              id: String(row.id),
              exerciseName: row.exerciseName,
              sets: Number(row.sets ?? 0),
              reps: Number(row.reps ?? 0),
              weightKg: Number(row.weightKg ?? 0),
              note: row.note ?? "",
              createdAt: row.createdAt
                ? new Date(row.createdAt).toISOString()
                : new Date().toISOString(),
            })),
          );
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    res.status(200).json(demoTrackerStore.workouts);
    return;
  }

  if (req.method === "POST") {
    const body = readBody(req);
    if (connectionString && sessionUser) {
      try {
        const { db } = await import("../../db");
        const { eq } = await import("drizzle-orm");
        const schema = await import("../../db/schema");
        const userId = Number(sessionUser.id);
        if (!Number.isNaN(userId)) {
          const record = {
            userId,
            exerciseName: String(body.exerciseName ?? ""),
            sets: Number(body.sets ?? 0),
            reps: Number(body.reps ?? 0),
            weightKg: String(body.weightKg ?? 0),
            note: String(body.note ?? ""),
          };

          const [row] = await db
            .insert(schema.workoutLogs)
            .values(record)
            .returning();
          if (row) {
            const response = {
              id: String(row.id),
              exerciseName: row.exerciseName,
              sets: Number(row.sets ?? 0),
              reps: Number(row.reps ?? 0),
              weightKg: Number(row.weightKg ?? 0),
              note: row.note ?? "",
              createdAt: row.createdAt
                ? new Date(row.createdAt).toISOString()
                : new Date().toISOString(),
            };
            demoTrackerStore.workouts.unshift(response);
            return res.status(201).json(response);
          }
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    const record = {
      id: body.id ?? `workout-${Date.now()}`,
      exerciseName: String(body.exerciseName ?? ""),
      sets: Number(body.sets ?? 0),
      reps: Number(body.reps ?? 0),
      weightKg: Number(body.weightKg ?? 0),
      note: String(body.note ?? ""),
      createdAt: body.createdAt ?? new Date().toISOString(),
    };

    demoTrackerStore.workouts.unshift(record);
    res.status(201).json(record);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
