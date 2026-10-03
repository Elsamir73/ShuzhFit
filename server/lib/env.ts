import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url().refine(
    (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
  ).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  YOUTUBE_API_KEY: z.string().trim().min(1).optional(),
  YOUTUBE_CHANNEL_ID: z.string().trim().min(1).optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function validatedEnv(): ServerEnv {
  // Parse only the four server variables this application depends on. Invalid
  // optional YouTube values are omitted so they cannot break unrelated routes.
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID,
  });

  if (parsed.success) return parsed.data;

  // Required and optional values have different failure behavior: retain valid
  // values, while treating invalid optional YouTube settings as absent.
  return {
    DATABASE_URL: serverEnvSchema.shape.DATABASE_URL.safeParse(process.env.DATABASE_URL).success
      ? process.env.DATABASE_URL
      : undefined,
    JWT_SECRET: serverEnvSchema.shape.JWT_SECRET.safeParse(process.env.JWT_SECRET).success
      ? process.env.JWT_SECRET
      : undefined,
    YOUTUBE_API_KEY: serverEnvSchema.shape.YOUTUBE_API_KEY.safeParse(process.env.YOUTUBE_API_KEY).success
      ? process.env.YOUTUBE_API_KEY?.trim()
      : undefined,
    YOUTUBE_CHANNEL_ID: serverEnvSchema.shape.YOUTUBE_CHANNEL_ID.safeParse(process.env.YOUTUBE_CHANNEL_ID).success
      ? process.env.YOUTUBE_CHANNEL_ID?.trim()
      : undefined,
  };
}

export class ServerConfigurationError extends Error {
  constructor(readonly variableName: "DATABASE_URL" | "JWT_SECRET") {
    super(`Server not configured: ${variableName}`);
    this.name = "ServerConfigurationError";
  }
}

export function requireServerEnv(name: "DATABASE_URL" | "JWT_SECRET"): string {
  const value = validatedEnv()[name];
  if (!value) throw new ServerConfigurationError(name);
  return value;
}

export function getYouTubeEnv(): {
  apiKey?: string;
  channelId?: string;
  apiKeySet: boolean;
  channelIdSet: boolean;
} {
  const env = validatedEnv();
  return {
    ...(env.YOUTUBE_API_KEY ? { apiKey: env.YOUTUBE_API_KEY } : {}),
    ...(env.YOUTUBE_CHANNEL_ID ? { channelId: env.YOUTUBE_CHANNEL_ID } : {}),
    apiKeySet: Boolean(env.YOUTUBE_API_KEY),
    channelIdSet: Boolean(env.YOUTUBE_CHANNEL_ID),
  };
}

export function isEnvSet(name: "JWT_SECRET" | "YOUTUBE_API_KEY" | "YOUTUBE_CHANNEL_ID"): boolean {
  const env = validatedEnv();
  return Boolean(env[name]);
}
