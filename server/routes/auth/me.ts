import { eq } from "drizzle-orm";
import { requireAuth, sendError, type ApiRequest, type ApiResponse } from "../../lib/http.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  const claims = await requireAuth(req, res);
  if (!claims) return;
  try {
    const [{ db }, schema] = await Promise.all([import("../../../db/index.js"), import("../../../db/schema.js")]);
    const [user] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, onboardedAt: schema.users.onboardedAt })
      .from(schema.users).where(eq(schema.users.id, Number(claims.id))).limit(1);
    if (!user) {
      sendError(res, 401, "UNAUTHORIZED", "Please sign in to continue.");
      return;
    }
    res.status(200).json({ user: { id: String(user.id), name: user.name, email: user.email, role: user.role === "admin" ? "admin" as const : "user" as const, onboarded: Boolean(user.onboardedAt) } });
  } catch {
    sendError(res, 500, "SESSION_LOOKUP_FAILED", "Unable to load your session.");
  }
}
