import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy the Neon connection string into .env.");
}
if (/postgres(?:ql)?:\/\/(?:user:password@host|USER:PASSWORD@HOST)/i.test(databaseUrl)) {
  throw new Error("Replace the sample DATABASE_URL with the connection string from Neon.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
