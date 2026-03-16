import { readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const rulesDir = resolve(import.meta.dirname, "lint-rules");

const files = (await readdir(rulesDir)).filter((f) => f.endsWith(".mjs"));

let failed = false;

for (const file of files) {
  const ruleName = file.replace(/\.mjs$/, "");
  const { check } = await import(join(rulesDir, file));
  const result = await check();

  if (!result.ok) {
    failed = true;
    console.error(`\n✗ ${ruleName}`);
    for (const msg of result.messages) {
      console.error(`  ${msg}`);
    }
  }
}

if (failed) {
  console.error("");
  process.exit(1);
} else {
  console.log("All workspace lint checks passed.");
}
