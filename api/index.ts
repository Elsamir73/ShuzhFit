import type { ApiRequest, ApiResponse } from "../server/lib/http.js";
import { dispatchApiRequest, originalApiUrl } from "../server/router.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  req.url = originalApiUrl(req);
  await dispatchApiRequest(req, res);
}
