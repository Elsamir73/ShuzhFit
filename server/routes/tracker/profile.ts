import { verifyAuthToken } from "../auth/_helpers.js";
import { demoTrackerStore, readBody } from "./_demo-store.js";

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
        const { db } = await import("../../../db/index.js");
        const { eq } = await import("drizzle-orm");
        const schema = await import("../../../db/schema.js");
        const userId = Number(sessionUser.id);
        if (!Number.isNaN(userId)) {
          const [row] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);

          if (row) {
            return res.status(200).json({
              name: row.name,
              email: row.email,
              goalType: row.goalType ?? "fat-loss",
              targetWeightKg: Number(row.targetWeightKg ?? 73),
              weeklyWorkoutTarget: Number(row.weeklyWorkoutTarget ?? 4),
              heightCm: Number(row.heightCm ?? 178),
              sex: row.sex ?? "male",
            });
          }
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    res.status(200).json(demoTrackerStore.profile);
    return;
  }

  if (req.method === "POST") {
    const body = readBody(req);
    if (connectionString && sessionUser) {
      try {
        const { db } = await import("../../../db/index.js");
        const { eq } = await import("drizzle-orm");
        const schema = await import("../../../db/schema.js");
        const userId = Number(sessionUser.id);
        if (!Number.isNaN(userId)) {
          const nextProfile = {
            name: String(body.name ?? demoTrackerStore.profile.name),
            email: String(body.email ?? demoTrackerStore.profile.email),
            goalType: String(
              body.goalType ?? demoTrackerStore.profile.goalType,
            ),
            targetWeightKg: Number(
              body.targetWeightKg ?? demoTrackerStore.profile.targetWeightKg,
            ),
            weeklyWorkoutTarget: Number(
              body.weeklyWorkoutTarget ??
                demoTrackerStore.profile.weeklyWorkoutTarget,
            ),
            heightCm: Number(
              body.heightCm ?? demoTrackerStore.profile.heightCm,
            ),
            sex: String(body.sex ?? demoTrackerStore.profile.sex),
          };

          const [updated] = await db
            .update(schema.users)
            .set({
              name: nextProfile.name,
              email: nextProfile.email,
              goalType: nextProfile.goalType,
              targetWeightKg: String(nextProfile.targetWeightKg),
              weeklyWorkoutTarget: nextProfile.weeklyWorkoutTarget,
              heightCm: nextProfile.heightCm,
              sex: nextProfile.sex,
            })
            .where(eq(schema.users.id, userId))
            .returning();

          if (updated) {
            const response = {
              name: updated.name,
              email: updated.email,
              goalType: updated.goalType ?? "fat-loss",
              targetWeightKg: Number(updated.targetWeightKg ?? 73),
              weeklyWorkoutTarget: Number(updated.weeklyWorkoutTarget ?? 4),
              heightCm: Number(updated.heightCm ?? 178),
              sex: updated.sex ?? "male",
            };
            demoTrackerStore.profile = response;
            return res.status(200).json(response);
          }
        }
      } catch {
        // Fall through to the demo tracker store when the DB is unavailable.
      }
    }

    demoTrackerStore.profile = {
      name: String(body.name ?? demoTrackerStore.profile.name),
      email: String(body.email ?? demoTrackerStore.profile.email),
      goalType: String(body.goalType ?? demoTrackerStore.profile.goalType),
      targetWeightKg: Number(
        body.targetWeightKg ?? demoTrackerStore.profile.targetWeightKg,
      ),
      weeklyWorkoutTarget: Number(
        body.weeklyWorkoutTarget ??
          demoTrackerStore.profile.weeklyWorkoutTarget,
      ),
      heightCm: Number(body.heightCm ?? demoTrackerStore.profile.heightCm),
      sex: String(body.sex ?? demoTrackerStore.profile.sex),
    };

    res.status(200).json(demoTrackerStore.profile);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
