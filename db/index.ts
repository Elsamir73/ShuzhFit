import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. Add it to your environment before running the app.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export * from "./schema";
