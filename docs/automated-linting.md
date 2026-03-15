# Automated Linting

Status: durable reference

## Purpose

This project is developed primarily by AI coding agents. Lint rules serve two functions:

1. **Enforcement** — prevent architectural violations from being introduced silently.
2. **Teaching** — every lint error message should tell the agent exactly what is wrong, why, and how to fix it. The error message is the documentation.

When an agent trips a lint rule, the error output alone should be enough context to produce the correct fix without needing to read additional docs.

## Tooling Stack

### ESLint v9 (flat config) with custom rules

The primary linting tool. ESLint flat config (`eslint.config.js`) runs custom rules written as local JS/TS modules. Custom rules live in an `eslint-rules/` directory at the project root. Each rule is a small AST visitor.

**Why custom rules instead of just config?** Config-only rules (`no-restricted-imports`, overrides) can cover simple cases, but custom rules allow agent-teaching error messages that reference specific docs sections and suggest exact fixes.

### dependency-cruiser

Validates the full module dependency graph against the allowed DAG defined in `docs/module-structure.md`. Produces a report of all boundary violations. Configured via `.dependency-cruiser.cjs` at the project root.

### TypeScript strict mode

`tsconfig.json` with `strict: true` catches a large class of errors for free — null safety, implicit any, unused locals. This is the baseline, not a substitute for architectural lint.

### Vitest architectural tests

A small number of tests in `tests/architecture/` that programmatically verify structural properties — things that are easier to assert in a test than express as a lint rule (e.g., "every generator module has an `index.ts`").

## Rule Sources

Lint rules are derived from constraints documented across the project's durable reference docs:

| Source document | Constraint area |
|---|---|
| `docs/module-structure.md` | Dependency DAG, import direction, public API via index.ts, naming conventions |
| `docs/architecture-principles.md` | Renderer isolation, semantic-before-geometric, determinism, module boundaries |
| `docs/verification-strategy.md` | Generator outputs must be inspectable, seeds required |
| `docs/product-vision.md` | Data-first generation, engine portability |

New rules can also be added by explicitly instructing an agent: "add a lint rule that enforces X." The agent should add the rule to `eslint-rules/`, register it in `eslint.config.js`, and document it in this file.

## File Layout

```
helsinki-v1/
├── eslint.config.js              # ESLint v9 flat config — registers all rules
├── eslint-rules/                 # custom rule implementations
│   ├── no-three-outside-workbench.js
│   ├── no-cross-generator-imports.js
│   ├── no-math-random.js
│   ├── no-date-now-in-generators.js
│   ├── require-index-public-api.js
│   └── ...
├── .dependency-cruiser.cjs       # dependency-cruiser config
├── tests/
│   └── architecture/             # structural vitest assertions
│       └── boundaries.test.ts
└── ...
```

## Rules Catalog

Each rule below includes: what it checks, why it exists, the agent-teaching error message, and what to configure.

---

### Rule 1: No Three.js outside workbench

**What:** Files outside `src/workbench/` must not import from `three` or any `three/*` subpath.

**Why:** Core generation logic must stay renderer-agnostic. Three.js scene graph, cameras, renderers, and materials are quarantined to `workbench/`. This keeps the generation stack portable to other engines. (See `docs/architecture-principles.md` — "Browser first, not browser locked".)

**Error message:**
```
Generation modules must not import Three.js.
FIX: Move rendering code to src/workbench/, or refactor to produce
plain data (typed interfaces, JSON-serializable objects) that workbench
converts to Three.js state. See docs/architecture-principles.md
§ 'Browser first, not browser locked'.
```

**Implementation:** Custom ESLint rule (`no-three-outside-workbench`). Visits `ImportDeclaration` and `ImportExpression` nodes. Checks if the source value starts with `three` and the file path is not under `src/workbench/`. Also enforceable as a dependency-cruiser forbidden rule.

---

### Rule 2: No cross-generator imports

**What:** Files under `src/generators/<stage-a>/` must not import from `src/generators/<stage-b>/`. Generators may only import from `contracts/`, `utils/`, `core-geometry/`, and `asset-library/`.

**Why:** Generators are pure pipeline stages. They receive upstream data as typed input — they do not call other generators. The orchestrator or test harness wires stages together. (See `docs/module-structure.md` — "Generators never import each other".)

**Error message:**
```
Generators must not import from other generators. Generator '<stage-a>'
is importing from generator '<stage-b>'.
FIX: Accept the upstream data as a function parameter using the contract
type (e.g., MassingResult) instead of importing the upstream generator.
The orchestrator in src/orchestrator/ is responsible for wiring stages.
See docs/module-structure.md § 'Dependency Rules'.
```

**Implementation:** Custom ESLint rule (`no-cross-generator-imports`). Resolves import paths relative to `src/generators/` and checks that the target is not a sibling generator directory. Also enforceable via dependency-cruiser.

---

### Rule 3: No `Math.random()` in generation code

**What:** Files under `src/generators/`, `src/core-geometry/`, `src/orchestrator/`, and `src/utils/` must not call `Math.random()`.

**Why:** Every generator must be deterministic. Same seed + same config must produce the same result. `Math.random()` breaks reproducibility. (See `docs/architecture-principles.md` — "Deterministic by default".)

**Error message:**
```
Math.random() is not allowed in generation code.
FIX: Use the seeded RNG utility from src/utils/ instead. Every
generator must accept a seed and produce deterministic output.
See docs/architecture-principles.md § 'Deterministic by default'.
```

**Implementation:** Custom ESLint rule (`no-math-random`). Visits `MemberExpression` nodes where the object is `Math` and the property is `random`. Scoped to generation-code directories via ESLint flat config file matching.

---

### Rule 4: No `Date.now()` in generation code

**What:** Files under `src/generators/`, `src/core-geometry/`, and `src/utils/` must not call `Date.now()` or `new Date()`.

**Why:** Time-dependent calls break determinism. If a generator needs a timestamp (e.g., for artifact metadata), it should receive it as an explicit parameter. (See `docs/architecture-principles.md` — "Deterministic by default".)

**Error message:**
```
Date.now() and new Date() are not allowed in generation code.
FIX: If you need a timestamp, accept it as an explicit parameter.
Generation functions must be pure: same inputs, same outputs.
See docs/architecture-principles.md § 'Deterministic by default'.
```

**Implementation:** Custom ESLint rule (`no-date-now-in-generators`). Visits `CallExpression` for `Date.now()` and `NewExpression` for `new Date()`.

---

### Rule 5: Import direction enforcement (dependency DAG)

**What:** Enforce the allowed import graph from `docs/module-structure.md`:

```
contracts          <- no dependencies
utils              <- contracts
core-geometry      <- contracts, utils
asset-library      <- contracts, utils
generators/*       <- contracts, utils, core-geometry, asset-library
orchestrator       <- contracts, generators
workbench          <- anything
```

**Why:** The layered architecture only works if imports flow strictly downward. Upward or circular imports create coupling that prevents independent testing and future portability.

**Error message (example):**
```
Import direction violation: 'src/utils/' is importing from
'src/generators/plot/'. Utils may only depend on contracts.
FIX: Move the needed logic into utils if it's truly shared, or
restructure so the dependency flows downward.
See docs/module-structure.md § 'Dependency Rules'.
```

**Implementation:** Primary enforcement via dependency-cruiser config (`.dependency-cruiser.cjs`). The config declares the module graph as a set of allowed/forbidden dependency rules. Can additionally be surfaced as a Vitest architectural test that runs `cruise()` and asserts zero violations.

---

### Rule 6: Public API via index.ts only

**What:** Imports from another module must go through the module's `index.ts`, not reach into internal files. For example, `import { something } from '../../core-geometry/polygon'` is forbidden — use `import { something } from '../../core-geometry'` (which resolves to `index.ts`).

**Why:** Each module's `index.ts` defines its public API. Internal files are implementation details. Reaching into internals creates tight coupling and makes refactoring dangerous. (See `docs/module-structure.md` — "Each module's index.ts is its public API".)

**Error message:**
```
Do not import internal files from another module. You imported
'core-geometry/polygon' — use 'core-geometry' (index.ts) instead.
FIX: If the function you need is not exported from the module's
index.ts, add it to the module's public API by re-exporting it
from index.ts. See docs/module-structure.md § 'Key constraints'.
```

**Implementation:** Custom ESLint rule (`require-index-public-api`). When an import crosses a module boundary (from one top-level `src/` directory to another), verify the import path resolves to the target module's `index.ts`, not a deeper file. This requires knowing the list of module root directories.

---

### Rule 7: No default exports

**What:** All exports must be named exports. `export default` is forbidden.

**Why:** Named exports are easier for agents to work with — they can be grepped, auto-imported, and renamed reliably. Default exports create ambiguity about the canonical name.

**Error message:**
```
Default exports are not allowed. Use named exports instead.
FIX: Replace 'export default function foo()' with
'export function foo()'. This makes the codebase easier for
automated tools and agents to navigate.
```

**Implementation:** ESLint built-in or `eslint-plugin-import` rule `no-default-export`.

---

### Rule 8: Contracts have zero runtime code

**What:** Files in `src/contracts/` may only contain type declarations, interfaces, enums, and type aliases. No runtime expressions, no function bodies, no class implementations.

**Why:** `contracts/` is the shared type layer. It must have zero runtime dependencies and zero side effects. If logic creeps in, it becomes a coupling point that's hard to test in isolation.

**Error message:**
```
Files in src/contracts/ must contain only types, interfaces, and enums.
Found runtime code (function/variable/class with implementation).
FIX: Move runtime logic to the appropriate module (utils/,
core-geometry/, or a generator). Contracts define data shapes only.
See docs/module-structure.md § 'contracts has zero runtime code'.
```

**Implementation:** Custom ESLint rule (`contracts-no-runtime`). In files under `src/contracts/`, flag any `FunctionDeclaration`, `VariableDeclaration` with an initializer that isn't a type alias, or `ClassDeclaration` with a method body.

---

### Rule 9: Naming conventions

**What:**
- Directory names must be kebab-case.
- Exported types and interfaces must be PascalCase.
- Exported functions must be camelCase.
- Contract types follow `{Stage}Config` / `{Stage}Result` pattern.
- Generator entry functions follow `generate{Stage}` pattern.

**Why:** Consistent naming makes the codebase predictable for agents and humans. An agent should be able to guess that the plot generator's entry function is called `generatePlot` and its output type is `PlotResult`.

**Error message (example):**
```
Exported function 'Generate_plot' does not follow camelCase convention.
FIX: Rename to 'generatePlot'. Generator entry functions use the
pattern 'generate{Stage}'. See docs/module-structure.md § 'Naming Conventions'.
```

**Implementation:** Partially covered by `@typescript-eslint/naming-convention` rule. Directory naming can be checked via a Vitest architectural test or a simple script. The `{Stage}Config`/`{Stage}Result` and `generate{Stage}` patterns are conventions enforced by review and documented here, not easily expressed as a lint rule (since the set of stages is not fixed).

---

## dependency-cruiser Configuration

The `.dependency-cruiser.cjs` config should encode the full dependency DAG. A sketch of the key rules:

```js
module.exports = {
  forbidden: [
    {
      name: 'no-three-outside-workbench',
      comment: 'Only workbench may import Three.js. See docs/architecture-principles.md.',
      severity: 'error',
      from: { pathNot: '^src/workbench/' },
      to: { path: '^node_modules/three' }
    },
    {
      name: 'no-cross-generator-imports',
      comment: 'Generators must not import other generators. See docs/module-structure.md.',
      severity: 'error',
      from: { path: '^src/generators/[^/]+/' },
      to: { path: '^src/generators/[^/]+/', pathNot: '$from.path' }
    },
    {
      name: 'no-upward-imports-from-contracts',
      comment: 'Contracts must not import from any other module.',
      severity: 'error',
      from: { path: '^src/contracts/' },
      to: { path: '^src/(utils|core-geometry|asset-library|generators|orchestrator|workbench)/' }
    },
    {
      name: 'no-upward-imports-from-utils',
      comment: 'Utils may only import from contracts.',
      severity: 'error',
      from: { path: '^src/utils/' },
      to: { path: '^src/(core-geometry|asset-library|generators|orchestrator|workbench)/' }
    },
    {
      name: 'no-generators-importing-orchestrator-or-workbench',
      comment: 'Generators must not import from orchestrator or workbench.',
      severity: 'error',
      from: { path: '^src/generators/' },
      to: { path: '^src/(orchestrator|workbench)/' }
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies anywhere.',
      severity: 'error',
      from: {},
      to: { circular: true }
    }
  ]
};
```

## Vitest Architectural Tests

Some constraints are easier to verify as tests than as lint rules:

```
tests/architecture/
├── boundaries.test.ts       # runs dependency-cruiser programmatically, asserts zero violations
├── module-structure.test.ts # checks every module has index.ts, naming conventions on directories
└── contracts-purity.test.ts # verifies contracts/ exports are all type-only (TS compiler API)
```

These tests run as part of the normal `vitest` suite. They are fast (no browser, no rendering) and should be included in CI and pre-commit checks.

## How to Add a New Rule

1. **Identify the constraint.** Where is it documented? If it's not in a durable doc yet, add it there first.
2. **Choose the enforcement mechanism.** Simple import restrictions → ESLint config or dependency-cruiser. AST-level checks → custom ESLint rule. Structural checks → Vitest architectural test.
3. **Write the agent-teaching error message first.** This is the most important part. The message must include: what is wrong, why it's wrong, how to fix it, and a pointer to the relevant doc.
4. **Implement the rule.** Put custom ESLint rules in `eslint-rules/`. Register in `eslint.config.js`. Add to this catalog.
5. **Test the rule.** Each custom ESLint rule should have a small test file in `eslint-rules/tests/` verifying it fires on bad code and passes on good code.

## Pre-commit Enforcement

All lint rules run as a pre-commit check via a git hook (using `lefthook` or `lint-staged` + `husky`). This means violations are caught before they enter the repository. The CI pipeline runs the same checks as a safety net.

## ESLint Config Shape

The `eslint.config.js` uses ESLint v9 flat config. Sketch:

```js
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import noThreeOutsideWorkbench from './eslint-rules/no-three-outside-workbench.js';
import noCrossGeneratorImports from './eslint-rules/no-cross-generator-imports.js';
import noMathRandom from './eslint-rules/no-math-random.js';
import noDateNowInGenerators from './eslint-rules/no-date-now-in-generators.js';
import requireIndexPublicApi from './eslint-rules/require-index-public-api.js';
import contractsNoRuntime from './eslint-rules/contracts-no-runtime.js';

export default [
  // Base TypeScript config
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' }
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // ... standard TS rules, naming-convention, no-default-export
    }
  },

  // Generation code: no Math.random, no Date.now
  {
    files: [
      'src/generators/**/*.ts',
      'src/core-geometry/**/*.ts',
      'src/utils/**/*.ts',
      'src/orchestrator/**/*.ts'
    ],
    plugins: { 'custom': { rules: { 'no-math-random': noMathRandom, 'no-date-now': noDateNowInGenerators } } },
    rules: {
      'custom/no-math-random': 'error',
      'custom/no-date-now': 'error'
    }
  },

  // Three.js quarantine
  {
    files: ['src/**/*.ts'],
    ignores: ['src/workbench/**/*.ts'],
    plugins: { 'custom': { rules: { 'no-three-outside-workbench': noThreeOutsideWorkbench } } },
    rules: {
      'custom/no-three-outside-workbench': 'error'
    }
  },

  // Cross-generator imports
  {
    files: ['src/generators/**/*.ts'],
    plugins: { 'custom': { rules: { 'no-cross-generator-imports': noCrossGeneratorImports } } },
    rules: {
      'custom/no-cross-generator-imports': 'error'
    }
  },

  // Contracts purity
  {
    files: ['src/contracts/**/*.ts'],
    plugins: { 'custom': { rules: { 'contracts-no-runtime': contractsNoRuntime } } },
    rules: {
      'custom/contracts-no-runtime': 'error'
    }
  },

  // Public API enforcement (all cross-module imports)
  {
    files: ['src/**/*.ts'],
    plugins: { 'custom': { rules: { 'require-index-public-api': requireIndexPublicApi } } },
    rules: {
      'custom/require-index-public-api': 'error'
    }
  }
];
```

## Required npm Packages

The linting setup needs these dev dependencies:

```
eslint (v9+)
@typescript-eslint/eslint-plugin
@typescript-eslint/parser
typescript
dependency-cruiser
vitest (already planned)
lefthook (or husky + lint-staged)
```
