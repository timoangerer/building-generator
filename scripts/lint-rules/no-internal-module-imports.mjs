import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

// Module roots — imports crossing these boundaries must go through index.ts
const MODULE_ROOTS = [
  "contracts",
  "utils",
  "core-geometry",
  "orchestrator",
  "workbench",
  "gallery",
  "env-lab",
  "facade-lab",
  "plot-lab",
  "rendering",
  "test-fixtures",
  "test-utils",
];

// Generator stages are each a module root under generators/
const GENERATORS_PREFIX = "generators/";

export async function check() {
  const root = resolve(import.meta.dirname, "..", "..");
  const srcDir = resolve(root, "src");
  const messages = [];

  // Discover generator stage names
  const generatorsDir = resolve(srcDir, "generators");
  let generatorStages = [];
  try {
    generatorStages = (await readdir(generatorsDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    // generators dir may not exist
  }

  const allModuleRoots = [
    ...MODULE_ROOTS,
    ...generatorStages.map((s) => GENERATORS_PREFIX + s),
  ];

  const allFiles = await collectTsFiles(srcDir);

  for (const file of files(allFiles)) {
    const content = await readFile(file, "utf-8");
    const imports = extractImports(content);
    const relFile = relative(srcDir, file);
    const fileModule = resolveModule(relFile, allModuleRoots);

    for (const imp of imports) {
      if (!imp.startsWith("@/")) continue;
      const importPath = imp.slice(2); // strip @/
      const targetModule = resolveModule(importPath, allModuleRoots);

      if (!targetModule) continue;
      if (targetModule === fileModule) continue; // same module, OK

      // Check if import points to module root (i.e., exactly the module path)
      if (importPath === targetModule) continue; // e.g., @/contracts -> OK

      // It's a deep import into another module
      const relSource = relative(root, file);
      messages.push(
        `Internal module import: '${relSource}' imports '${imp}' directly instead of through the module's index.ts.`,
        `FIX: Import from '@/${targetModule}' instead, or add the needed export to`,
        `the module's index.ts. See docs/module-structure.md § 'Key constraints'.`,
      );
    }
  }

  return { ok: messages.length === 0, messages };
}

function* files(arr) {
  yield* arr;
}

function resolveModule(path, moduleRoots) {
  // Sort longest first so generators/element matches before generators
  const sorted = [...moduleRoots].sort((a, b) => b.length - a.length);
  for (const root of sorted) {
    if (path === root || path.startsWith(root + "/")) {
      return root;
    }
  }
  return null;
}

async function collectTsFiles(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectTsFiles(full)));
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
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
