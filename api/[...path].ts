import type { ApiRequest, ApiResponse } from "../server/lib/http";
import { dispatchApiRequest } from "../server/router";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  await dispatchApiRequest(req, res);
}