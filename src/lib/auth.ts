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

async function readError(response: Response, isRegister = false): Promise<string> {
  const body = await response.json().catch(() => null) as {
    error?: string | { code?: string; message?: string };
  } | null;
  const serverMessage = typeof body?.error === "string"
    ? body.error
    : typeof body?.error === "object"
      ? body.error.message
      : undefined;
  const code = typeof body?.error === "object" ? body.error.code : undefined;

  if (isRegister && response.status === 409) {
    return "An account with this email already exists";
  }
  if (code === "EMAIL_NOT_VERIFIED") return "Please verify your email first";
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

export async function registerAccount({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password: string;
}): Promise<{ emailSent: boolean }> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), password }),
  });
  if (!response.ok) throw new Error(await readError(response, true));
  const data = await response.json() as { needsVerification?: boolean; emailSent?: boolean };
  if (!data.needsVerification) throw new Error("Registration response was incomplete.");
  return { emailSent: Boolean(data.emailSent) };
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const response = await fetch("/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function verifyEmailToken(token: string): Promise<void> {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error(await readError(response));
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
