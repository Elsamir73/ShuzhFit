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
            .from(schema.foodLogs)
            .where(eq(schema.foodLogs.userId, userId))
            .orderBy(desc(schema.foodLogs.createdAt));

          return res.status(200).json(
            rows.map((row: any) => ({
              id: String(row.id),
              meal: row.name,
              calories: Number(row.calories ?? 0),
              protein: Number(row.proteinG ?? 0),
              carbs: Number(row.carbsG ?? 0),
              fat: Number(row.fatG ?? 0),
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

    res.status(200).json(demoTrackerStore.nutrition);
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
            name: String(body.meal ?? ""),
            calories: Number(body.calories ?? 0),
            proteinG: String(body.protein ?? 0),
            carbsG: String(body.carbs ?? 0),
            fatG: String(body.fat ?? 0),
            logDate: new Date().toISOString().slice(0, 10),
          };

          const [row] = await db
            .insert(schema.foodLogs)
            .values(record)
            .returning();
          if (row) {
            const response = {
              id: String(row.id),
              meal: row.name,
              calories: Number(row.calories ?? 0),
              protein: Number(row.proteinG ?? 0),
              carbs: Number(row.carbsG ?? 0),
              fat: Number(row.fatG ?? 0),
              createdAt: row.createdAt
                ? new Date(row.createdAt).toISOString()
                : new Date().toISOString(),
            };
            demoTrackerStore.nutrition.unshift(response);
            return res.status(201).json(response);
          }
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    const record = {
      id: body.id ?? `meal-${Date.now()}`,
      meal: String(body.meal ?? ""),
      calories: Number(body.calories ?? 0),
      protein: Number(body.protein ?? 0),
      carbs: Number(body.carbs ?? 0),
      fat: Number(body.fat ?? 0),
      createdAt: body.createdAt ?? new Date().toISOString(),
    };

    demoTrackerStore.nutrition.unshift(record);
    res.status(201).json(record);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
