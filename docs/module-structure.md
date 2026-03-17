# Module Structure

Status: durable reference

## Package Shape

The project is a single TypeScript package with directory-based module boundaries inside `src/`. There are no npm workspaces or separate packages. Module boundaries are enforced through import rules, not package isolation.

## Source Layout

```
src/
├── contracts/              # shared types, interfaces, and Zod schemas — zero runtime logic
│   ├── base.ts / base.schema.ts
│   ├── plot.ts / plot.schema.ts
│   ├── massing.ts / massing.schema.ts
│   ├── element.ts / element.schema.ts
│   ├── facade.ts / facade.schema.ts
│   ├── building.ts / building.schema.ts
│   ├── scene.ts / scene.schema.ts
│   ├── asset.ts
│   ├── artifact-meta.ts
│   └── index.ts
│
├── utils/                  # pure helpers: seeding, math, random
│   ├── seed.ts
│   ├── math.ts
│   └── index.ts
│
├── core-geometry/          # renderer-agnostic geometry ops and bounds
│   ├── wall-utils.ts
│   ├── element-bounds.ts   # ElementBounds type + computeElementBounds()
│   └── index.ts
│
├── generators/             # pipeline stages — pure data in, data out
│   ├── plot/
│   │   ├── plot-generator.ts
│   │   └── index.ts
│   ├── massing/
│   │   ├── massing-generator.ts
│   │   └── index.ts
│   ├── facade/
│   │   ├── facade-generator.ts
│   │   └── index.ts
│   ├── element/
│   │   ├── element-generator.ts
│   │   └── index.ts
│   └── building/
│       ├── building-assembler.ts
│       └── index.ts
│
├── orchestrator/           # wires generators into full pipelines
│   ├── city-pipeline.ts
│   └── index.ts
│
├── rendering/              # shared Three.js utilities used by viewers
│   ├── shared.ts           # buildPartGeometry(), buildingBaseColor()
│   └── index.ts
│
├── workbench/              # original single-entry Three.js scene viewer
│   ├── index.html
│   └── main.tsx
│
├── gallery/                # multi-stage visual test gallery
│   ├── index.html
│   ├── main.tsx
│   └── renderers/          # per-stage renderers (scene, element, facade, etc.)
│
├── env-lab/                # environment/atmosphere lab viewer
│   ├── index.html
│   └── viewer/main.tsx
│
├── facade-lab/             # facade decomposition debug viewer (2D canvas)
│   ├── index.html
│   └── viewer/main.tsx
│
├── plot-lab/               # plot generator debug viewer
│   ├── index.html
│   └── viewer/main.tsx
│
├── test-fixtures/          # test data factories for generators
│   ├── types.ts
│   ├── *-fixtures.ts
│   └── index.ts
│
└── test-utils/             # test helpers (geometry checks, generator test factory)
    ├── geometry-checks.ts
    ├── generator-test-factory.ts
    └── index.ts
```

Additional top-level directories:

```
experiments/                # standalone demos and experiments
└── water-clone/            # water shader clone from Cannon Clash
```

## Vite Configuration

A single `vite.config.ts` at the project root serves all entry points via multi-page `build.rollupOptions.input`. HTML files live inside their module directories (`src/workbench/index.html`, `src/gallery/index.html`, etc.). Dev scripts use `vite --open /src/<module>/index.html` to open specific pages.

## Dependency Rules

Import direction is strictly downward. The layers from bottom to top:

```
contracts          ← no dependencies
utils              ← contracts
core-geometry      ← contracts, utils
generators/*       ← contracts, utils, core-geometry
orchestrator       ← contracts, generators
rendering          ← contracts, utils, three.js
workbench          ← anything
gallery            ← anything
env-lab            ← anything
facade-lab         ← anything
plot-lab           ← anything
```

### Key constraints

- **Generators never import each other.** A facade generator does not import the massing generator. It receives a `MassingResult` as data. The orchestrator or test harness is responsible for wiring stages together.
- **Three.js is quarantined to rendering/viewer modules.** Only `rendering/`, `workbench/`, `gallery/`, `env-lab/`, `facade-lab/`, and `plot-lab/` may import from Three.js. Nothing in `generators/`, `contracts/`, `utils/`, `core-geometry/`, or `orchestrator/` should touch Three.js.
- **Each module's `index.ts` is its public API.** Do not reach into another module's internal files. If something needs to be public, re-export it from the module's index.
- **`contracts/` has zero runtime code.** Types, interfaces, Zod schemas, and enums only.

## Naming Conventions

- **Directories** use kebab-case: `core-geometry/`, `asset-library/`, `plot-generator.ts`.
- **Types and interfaces** use PascalCase: `PlotResult`, `MassingConfig`, `FacadeLayout`.
- **Functions** use camelCase: `generatePlot()`, `resolveFacade()`, `assembleBuilding()`.
- **Contract types** are named `{Stage}Config` for inputs and `{Stage}Result` for outputs: `PlotConfig` / `PlotResult`, `MassingConfig` / `MassingResult`.
- **Generator entry functions** are named `generate{Stage}`: `generatePlot()`, `generateMassing()`.

## When to Extract vs. Keep Inline

### Extract to `utils/`

When two or more modules need the exact same pure function — seeded random, polygon area, angle math.

### Extract to `contracts/`

When a type is part of the handoff between pipeline stages or is referenced by both a generator and the workbench.

### Extract to `core-geometry/`

When geometry logic (polygon intersection, offsetting, bounds computation) is needed by more than one generator or by both generators and viewers.

### Extract to `rendering/`

When Three.js rendering utilities (geometry construction, color computation) are needed by more than one viewer module.

### Keep inside the module

When a helper is specific to one generator's internal logic. A private function used only by facade-generator stays in `generators/facade/`. Do not prematurely share it.

### Signals that something should be extracted

- You are importing from a sibling generator's internals.
- You are duplicating more than ~10 lines of non-trivial logic across modules.
- A test needs a helper that lives inside a generator it shouldn't depend on.

### Signals to leave it alone

- Three similar lines exist in two places. Duplication is cheaper than a wrong abstraction.
- A helper is only used in one file. Keep it next to its caller.
- You are tempted to create a util "just in case." Wait until the second real use.

## Artifact Store

Generated outputs are stored locally for inspection, experimentation, and historical reference.

### Location

```
artifacts/                  # gitignored, local-only working data
├── plot/
│   └── 20260315-1105_s42_narrow-lot/
│       ├── meta.json
│       ├── plot.json
│       └── debug/          # optional debug visualizations
├── massing/
├── facade/
├── element/
├── building/
└── scene/
```

### How it works

- **Generators return data. They never write to disk.** A small `writeArtifact()` utility handles persistence when the caller explicitly opts in.
- **Each artifact lives in a timestamped directory** named `{YYYYMMDD-HHmm}_s{seed}_{short-label}/`.
- **`meta.json` records provenance**: seed, config, timestamp, generator version, and paths to input artifacts used.
- **`latest.json`** in each stage folder points to the most recent artifact path for convenience.

### meta.json shape

```json
{
  "stage": "massing",
  "seed": 42,
  "config": { "floors": [3, 5], "setback": 1.0 },
  "timestamp": "2026-03-15T11:05:00Z",
  "generatorVersion": "0.1.0",
  "inputs": {
    "plot": "plot/20260315-1032_s42/plot.json"
  },
  "tags": ["experiment", "narrow-lot"]
}
```

### Design decisions

- **Gitignored.** Artifacts are local working data, not source. Delete freely when stale.
- **No cleanup automation.** Manual deletion when artifacts accumulate. This is a solo Mac dev setup; file size is not a constraint.
- **Determinism vs. history.** Same seed + same config + same code should produce the same output. The `generatorVersion` field is there for the rare case where you want to understand why a regeneration differs, but there is no expectation of maintaining a full version history.
- **No remote sharing.** Local-only.
- **Symlinks are fine.** Mac-only setup, no Windows compatibility concern.

## Test Fixtures

Test inputs are committed to source control, separate from the transient artifact store.

```
test-fixtures/
├── plot/
│   └── simple-grid-3x2.json
├── massing/
│   └── two-story-box.json
└── ...
```

### Rules

- Fixtures follow the exact same shape as artifacts — same contract types, same JSON structure. The only difference is that fixtures are curated, small, and stable.
- Tests use committed fixtures or generate inputs inline. Tests never depend on the `artifacts/` folder.
- Fixtures should be maintained deliberately. When a contract type changes, update the fixtures to match.

## Orchestrator vs. Generator

Generators are pure pipeline stages: they take typed input and produce typed output. They do not call other generators.

The orchestrator (`src/orchestrator/`) is the place that wires generators into full pipelines. It is the only code (besides viewers and tests) that imports multiple generators together.

```
orchestrator calls: generatePlot → generateMassing → generateFacade → ... → assembleBuilding
```

Each generator does not know or care what comes before or after it in the pipeline. This keeps generators independently testable and composable.
