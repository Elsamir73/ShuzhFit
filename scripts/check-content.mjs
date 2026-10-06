import { readFile } from "node:fs/promises";
const content = await readFile(new URL("../src/content/about.ts", import.meta.url), "utf8");
if (content.includes("{{TODO")) {
  console.error("Replace the personal copy placeholders in src/content/about.ts before launch.");
  process.exitCode = 1;
} else {
  console.log("Content placeholders check passed.");
}
