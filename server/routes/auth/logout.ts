import { clearSessionCookie } from "./_helpers";
import { requireJson, requireOrigin, sendError, type ApiRequest, type ApiResponse } from "../../lib/http";

export default function handler(req: ApiRequest, res: ApiResponse): void {
  if (req.method !== "POST") {
    sendError(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    return;
  }
  if (!requireOrigin(req, res) || !requireJson(req, res)) return;
  clearSessionCookie(res);
  res.status(200).json({ success: true });
}
