## 1. Project Config & Dependencies

- [x] 1.1 Add `tsconfig.json` with strict mode, path aliases (`@/` → `src/`), and JSX support for React
- [x] 1.2 Update `package.json`: add all dependencies (react, react-dom, @types/react, @types/react-dom, three, @types/three, zod, tailwindcss, @tailwindcss/vite) and dev dependencies (vitest, typescript, @vitejs/plugin-react), add/update scripts (dev, build, test, test:watch)
- [x] 1.3 Create/update `vite.config.ts` with React plugin, Tailwind plugin, and path alias resolution
- [x] 1.4 Create `index.html` entry point referencing `src/workbench/main.tsx`
- [x] 1.5 Create `src/index.css` with `@import "tailwindcss"` for Tailwind v4

## 2. Directory Structure & Barrel Exports

- [x] 2.1 Create directory structure per `docs/module-structure.md`: `src/contracts/`, `src/utils/`, `src/core-geometry/`, `src/generators/{plot,massing,facade,element,building}/`, `src/orchestrator/`, `src/workbench/`, `src/test-utils/`
- [x] 2.2 Create `index.ts` barrel export in each directory

## 3. Contract Types

- [x] 3.1 Create `src/contracts/base.ts` with Vec2, Vec3, Polygon2D, AABB2 types
- [x] 3.2 Create `src/contracts/plot.ts` with PlotConfig, Plot, Street, PlotResult types
- [x] 3.3 Create `src/contracts/massing.ts` with MassingConfig, FloorInfo, WallSegment, BuildingMassing, MassingResult types
- [x] 3.4 Create `src/contracts/element.ts` with ElementType, BoxGeometry, ElementGeometry, ElementDefinition, ElementCatalogConfig, ElementCatalog types
- [x] 3.5 Create `src/contracts/facade.ts` with FacadeConfig, ElementPlacement, WallFacade, FacadeResult types
- [x] 3.6 Create `src/contracts/building.ts` with BuildingConfig, Building, BuildingResult types
- [x] 3.7 Create `src/contracts/scene.ts` with SceneConfig, Scene, SceneResult types
- [x] 3.8 Create `src/contracts/index.ts` with `export type *` barrel re-exports from all contract files

## 4. Zod Schemas

- [x] 4.1 Create `src/contracts/base.schema.ts` with Zod schemas for Vec2, Vec3, Polygon2D, AABB2
- [x] 4.2 Create `src/contracts/plot.schema.ts` with Zod schemas for PlotConfig, Plot, Street, PlotResult
- [x] 4.3 Create `src/contracts/massing.schema.ts` with Zod schemas for MassingConfig, FloorInfo, WallSegment, BuildingMassing, MassingResult
- [x] 4.4 Create `src/contracts/element.schema.ts` with Zod schemas for ElementType, BoxGeometry, ElementDefinition, ElementCatalog
- [x] 4.5 Create `src/contracts/facade.schema.ts` with Zod schemas for FacadeConfig, ElementPlacement, WallFacade, FacadeResult
- [x] 4.6 Create `src/contracts/building.schema.ts` with Zod schemas for BuildingConfig, Building, BuildingResult
- [x] 4.7 Create `src/contracts/scene.schema.ts` with Zod schemas for SceneConfig, Scene, SceneResult

## 5. Utilities

- [x] 5.1 Create `src/utils/seed.ts` with `createRng(seed: number): () => number` using mulberry32
- [x] 5.2 Create `src/utils/math.ts` with Vec2 operations: add, subtract, normalize, length, dot, cross2D
- [x] 5.3 Create `src/core-geometry/wall-utils.ts` with `wallLocalToWorld(wall, u, v): Vec3`

## 6. Stub Generators

- [x] 6.1 Create `src/generators/plot/plot-generator.ts` with `generatePlots()` returning 2-3 hardcoded rectangular plots and one street
- [x] 6.2 Create `src/generators/massing/massing-generator.ts` with `generateMassing()` extruding each plot to a fixed height with floors and walls
- [x] 6.3 Create `src/generators/element/element-generator.ts` with `generateElementCatalog()` returning fixed v1 catalog (window-small, window-large, door-standard, wall-panel)
- [x] 6.4 Create `src/generators/facade/facade-generator.ts` with `generateFacade()` returning empty facades
- [x] 6.5 Create `src/generators/building/building-assembler.ts` with `assembleBuildings()` joining massing + facades
- [x] 6.6 Create `src/generators/building/scene-composer.ts` with `composeScene()` bundling into SceneResult

## 7. Orchestrator

- [x] 7.1 Create `src/orchestrator/city-pipeline.ts` with `runCityPipeline(seed: number): SceneResult` wiring all stubs in sequence

## 8. Test Infrastructure

- [x] 8.1 Create `src/test-utils/generator-test-factory.ts` with `testGeneratorInvariants` generic factory
- [x] 8.2 Create `src/test-utils/geometry-checks.ts` with `withinBounds`, `noOverlaps`, `isFiniteCoord`

## 9. Stub Generator Tests

- [x] 9.1 Create `src/generators/plot/plot-generator.test.ts` validating output against PlotResult Zod schema
- [x] 9.2 Create `src/generators/massing/massing-generator.test.ts` validating output against MassingResult Zod schema
- [x] 9.3 Create `src/generators/element/element-generator.test.ts` validating output against ElementCatalog Zod schema
- [x] 9.4 Create `src/generators/facade/facade-generator.test.ts` validating output against FacadeResult Zod schema
- [x] 9.5 Create `src/generators/building/building-assembler.test.ts` validating BuildingResult schema
- [x] 9.6 Create `src/orchestrator/city-pipeline.test.ts` validating end-to-end pipeline produces valid SceneResult

## 10. Workbench

- [x] 10.1 Create `src/workbench/main.tsx` as React app entry point that calls the orchestrator and renders the scene
- [x] 10.2 Implement Three.js scene setup: dark background, warm directional light, MeshToonMaterial for buildings, flat planes for streets, OrbitControls

## 11. Verification

- [x] 11.1 Verify `npm run build` succeeds without errors
- [x] 11.2 Verify `npm run test` passes all schema validation tests
- [x] 11.3 Verify `npm run dev` shows the workbench with visible stub geometry
