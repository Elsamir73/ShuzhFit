import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { AuthUser } from "../../shared/auth";

export type { AuthRole, AuthUser } from "../../shared/auth";

const configuredJwtSecret = process.env.JWT_SECRET;
if (!configuredJwtSecret) {
  throw new Error("Missing JWT_SECRET environment variable.");
}
const authSecret = new TextEncoder().encode(configuredJwtSecret);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecret);
}

export async function verifyAuthToken(token: string): Promise<AuthUser> {
  const verified = await jwtVerify(token, authSecret);
  if (typeof verified.payload.sub !== "string" || typeof verified.payload.email !== "string") {
    throw new Error("Invalid session token.");
  }
  return {
    id: verified.payload.sub,
    name: typeof verified.payload.name === "string" ? verified.payload.name : "",
    email: verified.payload.email,
    role: verified.payload.role === "admin" ? "admin" : "user",
  };
}

export function setSessionCookie(res: import("../_lib/http").ApiResponse, token: string): void {
  res.setHeader("Set-Cookie", [
    `shuzhfit_session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=604800",
  ].join("; "));
}

export function clearSessionCookie(res: import("../_lib/http").ApiResponse): void {
  res.setHeader("Set-Cookie", "shuzhfit_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
}
