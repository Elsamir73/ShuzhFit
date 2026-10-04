import type { AuthUser } from "../../shared/auth";

export type { AuthRole, AuthUser } from "../../shared/auth";
type AuthListener = (user: AuthUser | null) => void;
let currentUser: AuthUser | null = null;
const listeners = new Set<AuthListener>();

function publish(user: AuthUser | null): void {
  currentUser = user;
  listeners.forEach((listener) => listener(user));
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function setCurrentUser(user: AuthUser): void {
  publish(user);
}

async function readError(response: Response, isRegister: boolean): Promise<string> {
  const body = await response.json().catch(() => null) as { error?: string | { message?: string } } | null;
  const serverMessage = typeof body?.error === "string"
    ? body.error
    : typeof body?.error === "object"
      ? body.error.message
      : undefined;

  if (isRegister && response.status === 409) {
    return "An account with this email already exists";
  }
  if (response.status === 400 && serverMessage) return serverMessage;
  if (response.status === 403 || response.status >= 500) {
    return "Something went wrong, please try again.";
  }
  return serverMessage ?? "Something went wrong, please try again.";
}

export async function loadCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    if (!response.ok) {
      publish(null);
      return null;
    }
    const data = await response.json() as { user?: AuthUser };
    publish(data.user ?? null);
    return data.user ?? null;
  } catch {
    publish(null);
    return null;
  }
}

export async function authenticateUser({ email, password, name, isRegister = false }: {
  email: string;
  password: string;
  name?: string;
  isRegister?: boolean;
}): Promise<AuthUser> {
  const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(isRegister
      ? { name: name?.trim() ?? "", email: email.trim().toLowerCase(), password }
      : { email: email.trim().toLowerCase(), password }),
  });
  if (!response.ok) throw new Error(await readError(response, isRegister));
  const data = await response.json() as { user?: AuthUser };
  if (!data.user) throw new Error("Authentication response did not include a user.");
  publish(data.user);
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: "{}",
  });
  if (!response.ok) throw new Error(await readError(response, false));
  publish(null);
}
