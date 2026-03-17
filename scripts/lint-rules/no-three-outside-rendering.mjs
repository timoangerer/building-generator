import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const ALLOWED_DIRS = [
  "workbench",
  "gallery",
  "env-lab",
  "facade-lab",
  "plot-lab",
  "rendering",
];

export async function check() {
  const root = resolve(import.meta.dirname, "..", "..");
  const srcDir = resolve(root, "src");
  const messages = [];

  const allFiles = await collectTsFiles(srcDir);

  for (const file of allFiles) {
    const relFile = relative(srcDir, file);
    const topDir = relFile.split("/")[0];

    if (ALLOWED_DIRS.includes(topDir)) continue;

    const content = await readFile(file, "utf-8");
    const imports = extractImports(content);

    for (const imp of imports) {
      if (imp === "three" || imp.startsWith("three/")) {
        const relPath = relative(root, file);
        messages.push(
          `Three.js import found in '${relPath}', which is not a rendering module.`,
          `FIX: Move rendering code to an appropriate viewer module (workbench/,`,
          `gallery/, env-lab/, etc.) or produce plain data that viewers convert`,
          `to Three.js state. See docs/architecture-principles.md.`,
        );
      }
    }
  }

  return { ok: messages.length === 0, messages };
}

async function collectTsFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectTsFiles(full)));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

function extractImports(content) {
  const imports = [];
  const regex = /(?:import|from)\s+["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}
