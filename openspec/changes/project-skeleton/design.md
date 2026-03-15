## Context

The repo contains documentation (`docs/`) defining the architecture, module structure, verification strategy, and visual style — but zero runnable code. The `package.json` has only `three` and `vite` as dependencies. There is no `src/` directory, no TypeScript config, no test runner, and no React setup.

Multiple agents will implement individual pipeline stages in parallel. They need a shared skeleton: typed contracts to code against, stub generators that produce valid outputs for integration, test infrastructure that validates outputs structurally, and a workbench that renders results visually.

## Goals / Non-Goals

**Goals:**
- Runnable project: `npm run dev` shows a 3D workbench, `npm run build` succeeds, `npm run test` passes
- All pipeline contract types defined with co-located Zod schemas
- Directory structure matching `docs/module-structure.md` exactly
- Stub generators returning minimal valid data for every stage
- Orchestrator wiring all stubs into an end-to-end pipeline
- Test infrastructure ready for generator implementers (generic test factory, geometry checks)
- Minimal workbench rendering SceneResult with OrbitControls

**Non-Goals:**
- Real generation logic (stubs return hardcoded/trivial data)
- ShadCN component library setup (no UI panels yet, just a canvas)
- Asset loading or GLTF support
- Playwright visual regression setup
- fast-check property-based testing setup
- Artifact store (`writeArtifact` persistence)
- Debug overlays or inspector panels

## Decisions

### 1. Vec2 uses `{x, z}` not `{x, y}`

The ground plane is XZ in Three.js. Using `{x, z}` for 2D coordinates avoids the y-axis confusion between 2D (screen) and 3D (world) coordinate systems. All generators and contracts use this convention.

**Alternative considered:** `{x, y}` for 2D — rejected because every conversion to 3D would require remembering that 2D-y maps to 3D-z.

### 2. Zod schemas co-located as `*.schema.ts` files

Each contract file (`plot.ts`) gets a sibling schema file (`plot.schema.ts`). Schemas mirror types exactly. This keeps `contracts/` types zero-runtime (pure `export type`) while making schemas available for test validation.

**Alternative considered:** Zod-first approach (derive types from schemas with `z.infer`) — rejected because it couples contract types to Zod at the type level and makes contracts harder to read as documentation.

### 3. Seeded PRNG using mulberry32

A simple, fast, deterministic 32-bit PRNG. Exported as `createRng(seed): () => number` returning values in [0,1). No external dependency needed.

**Alternative considered:** seedrandom npm package — rejected to avoid adding a dependency for a ~10-line function.

### 4. React + imperative Three.js (no R3F initially)

The workbench uses React for the app shell but creates the Three.js scene imperatively via `useRef` and `useEffect`. This avoids the R3F dependency while keeping the door open to add it later.

**Alternative considered:** React Three Fiber from the start — acceptable but adds complexity for what is currently a simple scene render. Can be introduced when viewers need React-driven interactivity.

### 5. Stub generators return hardcoded geometry

Stubs don't use the seeded RNG meaningfully — they return fixed rectangles, fixed heights, and fixed element catalogs. This is intentional: stubs exist to validate the contract types and orchestrator wiring, not to demonstrate generation quality.

### 6. Tailwind v4 with `@tailwindcss/vite` plugin

Tailwind v4 uses CSS-first configuration and the Vite plugin directly. No `tailwind.config.js` or `postcss.config.js` needed — just `@import "tailwindcss"` in the CSS entry point.

## Risks / Trade-offs

- **[Risk] Contract types may need revision as real generators are implemented** → Mitigation: Zod schemas and the generic test factory make contract changes mechanical — update the type, update the schema, tests catch mismatches automatically.
- **[Risk] Stub generators may mask integration issues** → Mitigation: Stubs return structurally valid data (validated by Zod tests). Real generators can swap in one at a time without breaking the pipeline.
- **[Risk] Imperative Three.js may need rewriting when R3F is adopted** → Mitigation: The workbench renderer is isolated in `src/workbench/` and is explicitly allowed to depend on anything. Swapping rendering approach has zero impact on generators or contracts.

## Open Questions

- Should `@react-three/fiber` and `@react-three/drei` be added from the start for OrbitControls, or use Three.js OrbitControls directly? Decision: start with Three.js OrbitControls to minimize initial dependencies.
