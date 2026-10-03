import { verifyAuthToken } from "../auth/_helpers";

export async function requireAdmin(req: any, res: any) {
  const cookie = req.headers.cookie ?? "";
  const token = cookie
    .split("; ")
    .find((part: string) => part.startsWith("shuzhfit_session="))
    ?.replace("shuzhfit_session=", "");

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const user = await verifyAuthToken(token);
    if (user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }

    return user;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}
