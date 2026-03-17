# Automated Linting

Status: durable reference

## Purpose

This project is developed primarily by AI coding agents. Lint rules serve two functions:

1. **Enforcement** — prevent architectural violations from being introduced silently.
2. **Teaching** — every lint error message should tell the agent exactly what is wrong, why, and how to fix it. The error message is the documentation.

When an agent trips a lint rule, the error output alone should be enough context to produce the correct fix without needing to read additional docs.

## Tooling Stack

### Workspace lint rules (`scripts/lint-rules/*.mjs`)

The primary linting mechanism. Each rule is a standalone `.mjs` file in `scripts/lint-rules/` that exports an `async function check()` returning `{ ok: boolean; messages: string[] }`. Rules are auto-discovered and run by `scripts/lint-workspace.mjs`.

Run via: `npm run lint`

### TypeScript strict mode

`tsconfig.json` with `strict: true` catches a large class of errors for free — null safety, implicit any, unused locals. This is the baseline, not a substitute for architectural lint.

## File Layout

```
scripts/
├── lint-workspace.mjs               # orchestrator — discovers and runs all lint rules
└── lint-rules/                      # one file per rule
    ├── no-images-in-root.mjs
    ├── no-cross-generator-imports.mjs
    ├── no-internal-module-imports.mjs
    └── no-three-outside-rendering.mjs
```

## Rules Catalog

Each rule below includes: what it checks, why it exists, and the agent-teaching error message.

---

### Rule: no-images-in-root

**What:** No image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`) in the project root directory.

**Why:** Screenshots and debug images should not be committed to the repo root. Place documentation images in `docs/` or remove debug artifacts before committing.

**Error message:**
```
Image file(s) found in the project root: <files>
FIX: Delete these files. Screenshots and images must not be committed
to the repository root. If an image is needed for documentation, place it
in docs/ or a relevant subdirectory.
```

---

### Rule: no-cross-generator-imports

**What:** Files in `src/generators/<stage-a>/` must not import from `src/generators/<stage-b>/`. Generators may only import from `contracts/`, `utils/`, `core-geometry/`, and shared modules.

**Why:** Generators are pure pipeline stages. They receive upstream data as typed input — they do not call other generators. The orchestrator or test harness wires stages together. (See `docs/module-structure.md` — "Generators never import each other".)

**Error message:**
```
Generator '<stage-a>' imports from generator '<stage-b>' in <file>.
FIX: Generators must not import each other. Move shared utilities to
src/core-geometry/ or src/utils/, or accept upstream data as a typed parameter.
See docs/module-structure.md § 'Dependency Rules'.
```

---

### Rule: no-internal-module-imports

**What:** Cross-module imports must go through the target module's `index.ts`, not reach into internal files. Module roots: `contracts`, `utils`, `core-geometry`, `generators/*` (each stage), `orchestrator`, `workbench`, `gallery`, `env-lab`, `facade-lab`, `plot-lab`, `rendering`, `test-fixtures`, `test-utils`.

**Why:** Each module's `index.ts` defines its public API. Reaching into internals creates tight coupling and makes refactoring dangerous. (See `docs/module-structure.md` — "Each module's index.ts is its public API".)

**Error message:**
```
Internal module import: '<file>' imports '<target>' directly instead of
through the module's index.ts.
FIX: Import from '<module-root>' instead, or add the needed export to
the module's index.ts. See docs/module-structure.md § 'Key constraints'.
```

---

### Rule: no-three-outside-rendering

**What:** Files outside designated rendering/viewer modules must not import from `three` or any `three/*` subpath. Allowed locations: `src/workbench/`, `src/gallery/`, `src/env-lab/`, `src/facade-lab/`, `src/plot-lab/`, `src/rendering/`.

**Why:** Core generation logic must stay renderer-agnostic. Three.js is quarantined to viewer and rendering modules. (See `docs/architecture-principles.md`.)

**Error message:**
```
Three.js import found in '<file>', which is not a rendering module.
FIX: Move rendering code to an appropriate viewer module (workbench/,
gallery/, env-lab/, etc.) or produce plain data that viewers convert
to Three.js state. See docs/architecture-principles.md.
```

---

## How to Add a New Rule

1. **Identify the constraint.** Where is it documented? If it's not in a durable doc yet, add it there first.
2. **Write the agent-teaching error message first.** This is the most important part. The message must include: what is wrong, why it's wrong, how to fix it, and a pointer to the relevant doc.
3. **Create a new `.mjs` file** in `scripts/lint-rules/`. Export an `async function check()` that returns `{ ok: boolean, messages: string[] }`.
4. **Test it.** Run `npm run lint` and verify it fires on known violations and passes on clean code.
5. **Document it** in this file's Rules Catalog.
