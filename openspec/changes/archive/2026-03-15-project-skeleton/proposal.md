## Why

The repo has documentation and a vision but no runnable code. Parallel agents need a project skeleton — typed contracts, stub generators, test infrastructure, and a minimal workbench — so they can implement individual pipeline stages independently without stepping on each other.

## What Changes

- Initialize TypeScript + Vite + React project with strict config, path aliases, and all core dependencies (React, Three.js, Zod, Tailwind, Vitest)
- Create directory structure per `docs/module-structure.md` with barrel exports
- Define all pipeline contract types (`PlotResult`, `MassingResult`, `FacadeResult`, etc.) with co-located Zod schemas
- Implement utility foundations: seeded PRNG, Vec2 math, wall-local-to-world coordinate conversion
- Create stub generators for every pipeline stage that return minimal valid output
- Wire stubs through an orchestrator (`city-pipeline.ts`)
- Build a minimal React + Three.js workbench that renders the orchestrator's scene output
- Set up test infrastructure: generic `testGeneratorInvariants` factory, geometry check helpers, one test per stub validating against Zod schemas

## Capabilities

### New Capabilities

- `pipeline-contracts`: Shared TypeScript types and Zod schemas for all pipeline stage inputs/outputs (Vec2, Polygon2D, PlotResult, MassingResult, FacadeResult, ElementCatalog, BuildingResult, SceneResult)
- `generation-utilities`: Seeded PRNG, Vec2 math operations, wall-local-to-world coordinate conversion
- `stub-generators`: Minimal valid implementations of all pipeline stages (plot, massing, element-catalog, facade, building-assembly, scene-composition)
- `city-pipeline-orchestrator`: Wires all generator stages into a sequential pipeline producing a complete SceneResult
- `workbench-shell`: React + Three.js browser app that renders SceneResult as box meshes with OrbitControls and MeshToonMaterial
- `test-infrastructure`: Generic generator test factory, geometry check helpers, Zod schema validation tests for every stub

### Modified Capabilities

(none — greenfield project)

## Impact

- **package.json**: New dependencies (react, react-dom, three, zod, tailwindcss, vitest, typescript, @vitejs/plugin-react)
- **Build config**: New tsconfig.json, updated vite.config.ts, tailwind config, index.html entry point
- **Source tree**: Entire `src/` directory created from scratch
- **Test infrastructure**: `src/test-utils/` and per-generator test files established
- **No breaking changes**: greenfield, nothing exists yet to break
