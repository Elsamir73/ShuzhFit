import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!email) throw new Error("ADMIN_EMAIL is required.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const [user] = await db.update(users).set({ role: "admin" }).where(eq(users.email, email)).returning({ email: users.email });
if (!user) throw new Error(`No account exists for ADMIN_EMAIL (${email}). Create the account first.`);
console.log(`Promoted ${user.email} to admin.`);
