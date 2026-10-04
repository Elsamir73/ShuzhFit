import { header, type ApiHandler, type ApiRequest, type ApiResponse } from "./lib/http.js";
import { requireServerEnv, ServerConfigurationError } from "./lib/env.js";
import adminBlogs from "./routes/admin/blogs.js";
import adminComments from "./routes/admin/comments.js";
import adminExercises from "./routes/admin/exercises.js";
import adminMessages from "./routes/admin/messages.js";
import adminVideos from "./routes/admin/videos.js";
import authLogin from "./routes/auth/login.js";
import authLogout from "./routes/auth/logout.js";
import authMe from "./routes/auth/me.js";
import authRegister from "./routes/auth/register.js";
import contact from "./routes/contact.js";
import contentBlogs from "./routes/content/blogs.js";
import contentComments from "./routes/content/comments.js";
import contentExercises from "./routes/content/exercises.js";
import favorites from "./routes/content/favorites.js";
import nutrition from "./routes/nutrition.js";
import onboarding from "./routes/onboarding.js";
import profile from "./routes/profile.js";
import program from "./routes/program.js";
import progress from "./routes/progress.js";
import search from "./routes/search.js";
import today from "./routes/today.js";
import trackerNutrition from "./routes/tracker/nutrition.js";
import trackerProfile from "./routes/tracker/profile.js";
import trackerProgress from "./routes/tracker/progress.js";
import trackerWorkouts from "./routes/tracker/workouts.js";
import workout from "./routes/workouts.js";
import workoutDetail from "./routes/workouts/[id].js";
import workoutExercises from "./routes/workouts/[id]/exercises.js";
import workoutSets from "./routes/workouts/[id]/sets.js";
import youtubeVideos from "./routes/youtube/videos.js";
import health from "./routes/health.js";

export const routeTable = new Map<string, ApiHandler>([
  ["GET /health", health],
  ["GET /auth/me", authMe],
  ["POST /auth/login", authLogin],
  ["POST /auth/logout", authLogout],
  ["POST /auth/register", authRegister],
  ["GET /admin/blogs", adminBlogs],
  ["POST /admin/blogs", adminBlogs],
  ["GET /admin/comments", adminComments],
  ["DELETE /admin/comments", adminComments],
  ["GET /admin/exercises", adminExercises],
  ["POST /admin/exercises", adminExercises],
  ["GET /admin/messages", adminMessages],
  ["DELETE /admin/messages", adminMessages],
  ["GET /admin/videos", adminVideos],
  ["POST /admin/videos", adminVideos],
  ["POST /contact", contact],
  ["GET /content/blogs", contentBlogs],
  ["GET /blogs", contentBlogs],
  ["GET /content/comments", contentComments],
  ["POST /content/comments", contentComments],
  ["GET /comments", contentComments],
  ["POST /comments", contentComments],
  ["GET /content/exercises", contentExercises],
  ["GET /exercises", contentExercises],
  ["GET /content/favorites", favorites],
  ["POST /content/favorites", favorites],
  ["DELETE /content/favorites", favorites],
  ["GET /content/videos", youtubeVideos],
  ["GET /youtube/videos", youtubeVideos],
  ["GET /videos", youtubeVideos],
  ["GET /nutrition", nutrition],
  ["POST /nutrition", nutrition],
  ["PATCH /nutrition", nutrition],
  ["DELETE /nutrition", nutrition],
  ["POST /onboarding", onboarding],
  ["GET /profile", profile],
  ["PATCH /profile", profile],
  ["POST /profile", profile],
  ["DELETE /profile", profile],
  ["GET /program", program],
  ["PATCH /program", program],
  ["GET /progress", progress],
  ["POST /progress", progress],
  ["PATCH /progress", progress],
  ["DELETE /progress", progress],
  ["GET /search", search],
  ["GET /today", today],
  ["POST /today", today],
  ["GET /tracker/nutrition", trackerNutrition],
  ["POST /tracker/nutrition", trackerNutrition],
  ["GET /tracker/profile", trackerProfile],
  ["POST /tracker/profile", trackerProfile],
  ["GET /tracker/progress", trackerProgress],
  ["POST /tracker/progress", trackerProgress],
  ["GET /tracker/workouts", trackerWorkouts],
  ["POST /tracker/workouts", trackerWorkouts],
  ["GET /workouts", workout],
  ["POST /workouts", workout],
  ["PATCH /workouts", workout],
  ["DELETE /workouts", workout],
  ["GET /workouts/:id", workoutDetail],
  ["POST /workouts/:id/exercises", workoutExercises],
  ["DELETE /workouts/:id/exercises", workoutExercises],
  ["POST /workouts/:id/sets", workoutSets],
  ["DELETE /workouts/:id/sets", workoutSets],
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

function requestHeader(req: ApiRequest, name: string): string | undefined {
  const entry = Object.entries(req.headers).find(([key]) => key.toLowerCase() === name);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
}

export function originalApiUrl(req: ApiRequest): string {
  let source = req.url ?? "/api";
  const initialPath = source.split("?", 1)[0];
  if (initialPath === "/api" || initialPath === "/api/") {
    for (const name of ["x-forwarded-uri", "x-matched-path", "x-vercel-forwarded-url"]) {
      const forwarded = requestHeader(req, name);
      if (forwarded) {
        source = forwarded;
        break;
      }
    }
  }

  const parsed = new URL(source, "http://localhost");
  let pathname = parsed.pathname.replace(/^\/api(?=\/|$)/, "");
  pathname = pathname.replace(/\/+$/, "") || "/";
  return `${pathname}${parsed.search}`;
}

export async function dispatchApiRequest(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  try {
    const normalizedUrl = new URL(originalApiUrl(req), "http://localhost");
    const pathname = normalizedUrl.pathname;
    const urlQuery = normalizedUrl.searchParams;
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

    const isYouTube = pathname === "/youtube/videos" || pathname === "/content/videos" || pathname === "/videos";
    const isHealth = pathname === "/health";
    const isLoggedOutSessionCheck = req.method?.toUpperCase() === "GET" && pathname === "/auth/me" &&
      !header(req, "cookie")?.split(";").some((part) => part.trim().startsWith("shuzhfit_session="));
    if (!isYouTube && !isHealth && !isLoggedOutSessionCheck) requireServerEnv("DATABASE_URL");
    const jwtPaths = [
      "/auth/", "/admin/", "/onboarding", "/nutrition",
      "/profile", "/program", "/progress", "/today",
      "/tracker/", "/workouts", "/content/favorites",
      "/workouts/",
    ];
    if (!isLoggedOutSessionCheck && jwtPaths.some((prefix) => pathname.startsWith(prefix))) requireServerEnv("JWT_SECRET");

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
