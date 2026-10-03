import type { AuthUser } from "../../shared/auth.js";
import { verifyAuthToken } from "../routes/auth/_helpers.js";

export interface ApiRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): ApiResponse;
  setHeader(name: string, value: string | string[]): ApiResponse;
  end(): void;
  writableEnded?: boolean;
}

export type ApiHandler = (
  req: ApiRequest,
  res: ApiResponse,
) => void | Promise<void>;

export function sendError(
  res: ApiResponse,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({ error: { code, message } });
}

export function header(req: ApiRequest, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function requireJson(req: ApiRequest, res: ApiResponse): boolean {
  if (
    !header(req, "content-type")?.toLowerCase().startsWith("application/json")
  ) {
    sendError(
      res,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json.",
    );
    return false;
  }
  return true;
}

export function requireOrigin(req: ApiRequest, res: ApiResponse): boolean {
  const origin = header(req, "origin");
  const host = (header(req, "x-forwarded-host") ?? header(req, "host"))
    ?.split(",")[0]?.trim();
  if (!origin || !host) {
    sendError(
      res,
      403,
      "INVALID_ORIGIN",
      "Request origin could not be verified.",
    );
    return false;
  }
  try {
    const originUrl = new URL(origin);
    const requestHost = new URL(`http://${host}`).host;
    const isLocalhost = (hostname: string) =>
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
    const localhostDevMatch = process.env.NODE_ENV !== "production" &&
      isLocalhost(originUrl.hostname.toLowerCase()) &&
      isLocalhost(new URL(`http://${host}`).hostname.toLowerCase());
    if (originUrl.host.toLowerCase() !== requestHost.toLowerCase() && !localhostDevMatch) {
      sendError(
        res,
        403,
        "INVALID_ORIGIN",
        "Request origin could not be verified.",
      );
      return false;
    }
  } catch {
    sendError(
      res,
      403,
      "INVALID_ORIGIN",
      "Request origin could not be verified.",
    );
    return false;
  }
  return true;
}

export function parseBody<T extends import("zod").ZodType>(
  schema: T,
  body: unknown,
): import("zod").output<T> | null {
  let candidate = body;
  if (typeof body === "string") {
    try {
      candidate = JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  const parsed = schema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function sessionToken(req: ApiRequest): string | null {
  return (
    header(req, "cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("shuzhfit_session="))
      ?.slice("shuzhfit_session=".length) ?? null
  );
}

export async function requireAuth(
  req: ApiRequest,
  res: ApiResponse,
): Promise<AuthUser | null> {
  const token = sessionToken(req);
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Please sign in to continue.");
    return null;
  }
  try {
    return await verifyAuthToken(token);
  } catch {
    sendError(res, 401, "UNAUTHORIZED", "Please sign in to continue.");
    return null;
  }
}

export async function requireAdmin(
  req: ApiRequest,
  res: ApiResponse,
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (user && user.role !== "admin") {
    sendError(res, 403, "FORBIDDEN", "Admin access is required.");
    return null;
  }
  return user;
}
