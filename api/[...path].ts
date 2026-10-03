import type { ApiRequest, ApiResponse } from "../server/lib/http.js";
import { dispatchApiRequest } from "../server/router.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  await dispatchApiRequest(req, res);
}