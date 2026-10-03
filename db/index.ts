import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";
import { requireServerEnv } from "../server/lib/env.js";

const connectionString = requireServerEnv("DATABASE_URL");

const sql = neon(connectionString);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export * from "./schema.js";
