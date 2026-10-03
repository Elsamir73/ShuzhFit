import type { ApiHandler, ApiRequest, ApiResponse } from "./lib/http";
import { requireServerEnv, ServerConfigurationError } from "./lib/env";
import adminBlogs from "./routes/admin/blogs";
import adminComments from "./routes/admin/comments";
import adminExercises from "./routes/admin/exercises";
import adminMessages from "./routes/admin/messages";
import adminVideos from "./routes/admin/videos";
import authLogin from "./routes/auth/login";
import authLogout from "./routes/auth/logout";
import authMe from "./routes/auth/me";
import authRegister from "./routes/auth/register";
import contact from "./routes/contact";
import contentBlogs from "./routes/content/blogs";
import contentComments from "./routes/content/comments";
import contentExercises from "./routes/content/exercises";
import favorites from "./routes/content/favorites";
import nutrition from "./routes/nutrition";
import onboarding from "./routes/onboarding";
import profile from "./routes/profile";
import program from "./routes/program";
import progress from "./routes/progress";
import search from "./routes/search";
import today from "./routes/today";
import trackerNutrition from "./routes/tracker/nutrition";
import trackerProfile from "./routes/tracker/profile";
import trackerProgress from "./routes/tracker/progress";
import trackerWorkouts from "./routes/tracker/workouts";
import workout from "./routes/workouts";
import workoutDetail from "./routes/workouts/[id]";
import workoutExercises from "./routes/workouts/[id]/exercises";
import workoutSets from "./routes/workouts/[id]/sets";
import youtubeVideos from "./routes/youtube/videos";
import health from "./routes/health";

export const routeTable = new Map<string, ApiHandler>([
  ["GET /api/health", health],
  ["GET /api/auth/me", authMe],
  ["POST /api/auth/login", authLogin],
  ["POST /api/auth/logout", authLogout],
  ["POST /api/auth/register", authRegister],
  ["GET /api/admin/blogs", adminBlogs],
  ["POST /api/admin/blogs", adminBlogs],
  ["GET /api/admin/comments", adminComments],
  ["DELETE /api/admin/comments", adminComments],
  ["GET /api/admin/exercises", adminExercises],
  ["POST /api/admin/exercises", adminExercises],
  ["GET /api/admin/messages", adminMessages],
  ["DELETE /api/admin/messages", adminMessages],
  ["GET /api/admin/videos", adminVideos],
  ["POST /api/admin/videos", adminVideos],
  ["POST /api/contact", contact],
  ["GET /api/content/blogs", contentBlogs],
  ["GET /api/blogs", contentBlogs],
  ["GET /api/content/comments", contentComments],
  ["POST /api/content/comments", contentComments],
  ["GET /api/comments", contentComments],
  ["POST /api/comments", contentComments],
  ["GET /api/content/exercises", contentExercises],
  ["GET /api/exercises", contentExercises],
  ["GET /api/content/favorites", favorites],
  ["POST /api/content/favorites", favorites],
  ["DELETE /api/content/favorites", favorites],
  ["GET /api/content/videos", youtubeVideos],
  ["GET /api/youtube/videos", youtubeVideos],
  ["GET /api/videos", youtubeVideos],
  ["GET /api/nutrition", nutrition],
  ["POST /api/nutrition", nutrition],
  ["PATCH /api/nutrition", nutrition],
  ["DELETE /api/nutrition", nutrition],
  ["POST /api/onboarding", onboarding],
  ["GET /api/profile", profile],
  ["PATCH /api/profile", profile],
  ["POST /api/profile", profile],
  ["DELETE /api/profile", profile],
  ["GET /api/program", program],
  ["PATCH /api/program", program],
  ["GET /api/progress", progress],
  ["POST /api/progress", progress],
  ["PATCH /api/progress", progress],
  ["DELETE /api/progress", progress],
  ["GET /api/search", search],
  ["GET /api/today", today],
  ["POST /api/today", today],
  ["GET /api/tracker/nutrition", trackerNutrition],
  ["POST /api/tracker/nutrition", trackerNutrition],
  ["GET /api/tracker/profile", trackerProfile],
  ["POST /api/tracker/profile", trackerProfile],
  ["GET /api/tracker/progress", trackerProgress],
  ["POST /api/tracker/progress", trackerProgress],
  ["GET /api/tracker/workouts", trackerWorkouts],
  ["POST /api/tracker/workouts", trackerWorkouts],
  ["GET /api/workouts", workout],
  ["POST /api/workouts", workout],
  ["PATCH /api/workouts", workout],
  ["DELETE /api/workouts", workout],
  ["GET /api/workouts/:id", workoutDetail],
  ["POST /api/workouts/:id/exercises", workoutExercises],
  ["DELETE /api/workouts/:id/exercises", workoutExercises],
  ["POST /api/workouts/:id/sets", workoutSets],
  ["DELETE /api/workouts/:id/sets", workoutSets],
]);

export type RouteMatch = {
  handler?: ApiHandler;
  params: Record<string, string>;
  allowedMethods: string[];
};

function matchPath(
  routePath: string,
  requestPath: string,
): Record<string, string> | null {
  const routeSegments = routePath.split("/").filter(Boolean);
  const requestSegments = requestPath.split("/").filter(Boolean);
  if (routeSegments.length !== requestSegments.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index]!;
    const requestSegment = requestSegments[index]!;
    if (routeSegment.startsWith(":")) {
      try {
        params[routeSegment.slice(1)] = decodeURIComponent(requestSegment);
      } catch {
        return null;
      }
    } else if (routeSegment !== requestSegment) {
      return null;
    }
  }
  return params;
}

export function resolveRoute(method: string, pathname: string): RouteMatch {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const normalizedMethod = method.toUpperCase();
  const exactHandler = routeTable.get(`${normalizedMethod} ${normalizedPath}`);
  if (exactHandler)
    return { handler: exactHandler, params: {}, allowedMethods: [] };

  let params: Record<string, string> = {};
  const allowedMethods = new Set<string>();
  for (const [key, handler] of routeTable) {
    const separator = key.indexOf(" ");
    const routeMethod = key.slice(0, separator);
    const routePath = key.slice(separator + 1);
    const candidateParams = matchPath(routePath, normalizedPath);
    if (!candidateParams) continue;
    params = candidateParams;
    allowedMethods.add(routeMethod);
    if (routeMethod === normalizedMethod) {
      return { handler, params, allowedMethods: [...allowedMethods] };
    }
  }
  return { params, allowedMethods: [...allowedMethods] };
}

function requestPath(req: ApiRequest): {
  pathname: string;
  query: URLSearchParams;
} {
  const requestUrl = new URL(req.url ?? "/api", "http://localhost");
  return { pathname: requestUrl.pathname, query: requestUrl.searchParams };
}

export async function dispatchApiRequest(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  try {
    const { pathname, query: urlQuery } = requestPath(req);
    const match = resolveRoute(req.method ?? "GET", pathname);
    if (!match.handler) {
      if (match.allowedMethods.length > 0) {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }
      res.status(404).json({ error: "Not found" });
      return;
    }

    const query = { ...Object.fromEntries(urlQuery.entries()), ...req.query };
    for (const [key, value] of Object.entries(match.params)) query[key] = value;
    req.params = match.params;
    req.query = query;

    const isYouTube = pathname === "/api/youtube/videos" || pathname === "/api/content/videos" || pathname === "/api/videos";
    const isHealth = pathname === "/api/health";
    if (!isYouTube && !isHealth) requireServerEnv("DATABASE_URL");
    const jwtPaths = [
      "/api/auth/", "/api/admin/", "/api/onboarding", "/api/nutrition",
      "/api/profile", "/api/program", "/api/progress", "/api/today",
      "/api/tracker/", "/api/workouts", "/api/content/favorites",
      "/api/workouts/",
    ];
    if (jwtPaths.some((prefix) => pathname.startsWith(prefix))) requireServerEnv("JWT_SECRET");

    await match.handler(req, res);
  } catch (error) {
    if (!res.writableEnded) {
      if (error instanceof ServerConfigurationError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      });
    }
  }
}
