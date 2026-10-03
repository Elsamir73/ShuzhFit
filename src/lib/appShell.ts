export const APP_NAV_ITEMS = [
  { to: "/today", label: "Today" },
  { to: "/workout", label: "Train" },
  { to: "/nutrition-log", label: "Food" },
  { to: "/progress", label: "Progress" },
  { to: "/profile", label: "Profile" },
] as const;

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/plan",
  "/today",
  "/workout",
  "/workout-history",
  "/progress",
  "/nutrition-log",
  "/meal-planner",
  "/profile",
  "/logout",
] as const;

export function isAppRoute(pathname: string): boolean {
  const normalized = (pathname || "/").replace(/\/+$/, "") || "/";

  return APP_ROUTE_PREFIXES.some(
    (route) => normalized === route || normalized.startsWith(`${route}/`),
  );
}
