import dotenv from "dotenv";
import { getTableColumns, is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema.js";
import { findMissingColumns, type ColumnMap } from "./dbSchemaComparison.js";

dotenv.config();
dotenv.config({ path: ".env.local" });

function getExpectedColumns(): ColumnMap {
  const expected: Record<string, string[]> = {};
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const tableName = getTableConfig(value).name;
    expected[tableName] = Object.values(getTableColumns(value)).map((column) => column.name);
  }
  return expected;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\bpostgres(?:ql)?:\/\/[^\s"'<>]+/giu, "[redacted database URL]");
}

async function checkDatabaseSchema(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set; skipping database schema check.");
    return;
  }

  const sql = neon(connectionString);
  const columns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `;
  const actual: Record<string, string[]> = {};
  for (const column of columns) {
    if (typeof column.table_name !== "string" || typeof column.column_name !== "string") {
      throw new Error("Database returned an invalid schema column row.");
    }
    (actual[column.table_name] ??= []).push(column.column_name);
  }
  const missing = findMissingColumns(getExpectedColumns(), actual);

  if (missing.length > 0) {
    for (const item of missing) console.error(`MISSING: ${item}`);
    console.error("Run: npx drizzle-kit push, then redeploy");
    process.exitCode = 1;
    return;
  }

  console.log("Database schema OK");
}

try {
  await checkDatabaseSchema();
} catch (error) {
  console.error("Database schema check failed:", safeErrorMessage(error));
  process.exitCode = 1;
}
