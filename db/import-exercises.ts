import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { exercises } from "./schema.js";
import { guideRows, newRows } from "./data/importCatalog.js";

// Adds the new exercises and fills in guides for the existing ones.
// Safe to run many times: new rows are upserted by slug, existing rows only get guide fields.
// It never touches youtubeUrl, youtubeVideoId or imageUrl, so anything set in Admin stays.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required before running the exercise import.");
}

const db = drizzle(neon(connectionString), { logger: false });

async function main() {
  let added = 0;
  for (const row of newRows) {
    const { slug, ...rest } = row;
    await db
      .insert(exercises)
      .values({ slug, ...rest })
      .onConflictDoUpdate({
        target: exercises.slug,
        set: { ...rest, updatedAt: new Date() },
      });
    added += 1;
  }

  let updated = 0;
  const missing: string[] = [];
  for (const { slug, row } of guideRows) {
    const result = await db
      .update(exercises)
      .set({ ...row, updatedAt: new Date() })
      .where(eq(exercises.slug, slug))
      .returning({ id: exercises.id });
    if (result.length === 0) missing.push(slug);
    else updated += 1;
  }

  console.log(`Imported ${added} exercises, updated guides on ${updated} existing ones.`);
  if (missing.length > 0) {
    console.log(`Not found in database (run "npm run seed" first): ${missing.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("Exercise import failed:", error);
  process.exit(1);
});
