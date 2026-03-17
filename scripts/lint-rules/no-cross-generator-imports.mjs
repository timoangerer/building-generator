import { readdir, readFile } from "node:fs/promises";
import { resolve, join, relative, sep } from "node:path";

export async function check() {
  const root = resolve(import.meta.dirname, "..", "..");
  const generatorsDir = resolve(root, "src", "generators");
  const messages = [];

  const stages = (await readdir(generatorsDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const stage of stages) {
    const stageDir = resolve(generatorsDir, stage);
    const files = await collectTsFiles(stageDir);

    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const imports = extractImports(content);
      const relFile = relative(root, file);

      for (const imp of imports) {
        // Match @/generators/<other-stage>/...
        const match = imp.match(/^@\/generators\/([^/]+)/);
        if (!match) continue;
        const targetStage = match[1];
        if (targetStage !== stage) {
          messages.push(
            `Generator '${stage}' imports from generator '${targetStage}' in ${relFile.split(sep).pop()}.`,
            `FIX: Generators must not import each other. Move shared utilities to`,
            `src/core-geometry/ or src/utils/, or accept upstream data as a typed parameter.`,
            `See docs/module-structure.md § 'Dependency Rules'.`,
          );
        }
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
