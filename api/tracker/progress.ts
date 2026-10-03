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
            .from(schema.progressEntries)
            .where(eq(schema.progressEntries.userId, userId))
            .orderBy(desc(schema.progressEntries.createdAt));

          return res.status(200).json(
            rows.map((row: any) => ({
              id: String(row.id),
              date: row.date
                ? new Date(row.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              weightKg: Number(row.weightKg ?? 0),
              bodyFatPct: Number(row.bodyFatPct ?? 0),
              waistCm: Number(row.waistCm ?? 0),
              notes: row.notes ?? "",
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

    res.status(200).json(demoTrackerStore.progress);
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
            date: new Date(
              String(body.date ?? new Date().toISOString().slice(0, 10)),
            )
              .toISOString()
              .slice(0, 10),
            weightKg: String(body.weightKg ?? 0),
            bodyFatPct: String(body.bodyFatPct ?? 0),
            waistCm: String(body.waistCm ?? 0),
            notes: String(body.notes ?? ""),
          };

          const [row] = await db
            .insert(schema.progressEntries)
            .values(record)
            .returning();
          if (row) {
            const response = {
              id: String(row.id),
              date: row.date
                ? new Date(row.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              weightKg: Number(row.weightKg ?? 0),
              bodyFatPct: Number(row.bodyFatPct ?? 0),
              waistCm: Number(row.waistCm ?? 0),
              notes: row.notes ?? "",
              createdAt: row.createdAt
                ? new Date(row.createdAt).toISOString()
                : new Date().toISOString(),
            };
            demoTrackerStore.progress.unshift(response);
            return res.status(201).json(response);
          }
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    const record = {
      id: body.id ?? `progress-${Date.now()}`,
      date: String(body.date ?? new Date().toISOString().slice(0, 10)),
      weightKg: Number(body.weightKg ?? 0),
      bodyFatPct: Number(body.bodyFatPct ?? 0),
      waistCm: Number(body.waistCm ?? 0),
      notes: String(body.notes ?? ""),
      createdAt: body.createdAt ?? new Date().toISOString(),
    };

    demoTrackerStore.progress.unshift(record);
    res.status(201).json(record);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
