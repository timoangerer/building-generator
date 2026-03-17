## 1. Create Viewers Module Structure

- [x] 1.1 Create `src/viewers/shared/types.ts` with `RenderOptions`, `StageRenderer<T>`, and `ToolRenderer` interfaces
- [x] 1.2 Move `src/rendering/shared.ts` → `src/viewers/shared/geometry.ts`
- [x] 1.3 Move `src/gallery/renderers/three-setup.ts` → `src/viewers/shared/three-setup.ts`, update imports
- [x] 1.4 Create `src/viewers/shared/index.ts` barrel export

## 2. Move Stage Renderers

- [x] 2.1 Move `src/gallery/renderers/plot-renderer.ts` → `src/viewers/stages/plot-renderer.ts`, update imports
- [x] 2.2 Move `src/gallery/renderers/massing-renderer.ts` → `src/viewers/stages/massing-renderer.ts`, update imports
- [x] 2.3 Move `src/gallery/renderers/element-renderer.ts` → `src/viewers/stages/element-renderer.ts`, update imports
- [x] 2.4 Move `src/gallery/renderers/facade-renderer.ts` → `src/viewers/stages/facade-renderer.ts`, update imports
- [x] 2.5 Move `src/gallery/renderers/building-renderer.ts` → `src/viewers/stages/building-renderer.ts`, update imports
- [x] 2.6 Move `src/gallery/renderers/scene-renderer.ts` → `src/viewers/stages/scene-renderer.ts`, update imports
- [x] 2.7 Move `src/facade-lab/renderer/facade-canvas.ts` → `src/viewers/stages/facade-canvas.ts`, update imports
- [x] 2.8 Move `src/facade-lab/data-source.ts` → `src/viewers/stages/facade-data.ts` and `data-source.test.ts` → `facade-data.test.ts`
- [x] 2.9 Create `src/viewers/stages/index.ts` with renderer factory, `getRenderer()`, and `getToolRenderer()`

## 3. Move Environment Module

- [x] 3.1 Move `src/env-lab/viewer/env-scene.ts` → `src/viewers/environment/env-scene.ts`, update imports
- [x] 3.2 Move `src/env-lab/presets.ts` → `src/viewers/environment/presets.ts`
- [x] 3.3 Move `src/env-lab/registry.ts` → `src/viewers/environment/registry.ts`
- [x] 3.4 Move `src/env-lab/types.ts` → `src/viewers/environment/types.ts`
- [x] 3.5 Move `src/env-lab/sky/*` → `src/viewers/environment/sky/*`
- [x] 3.6 Move `src/env-lab/terrain/*` → `src/viewers/environment/terrain/*`
- [x] 3.7 Move `src/env-lab/water/*` → `src/viewers/environment/water/*`
- [x] 3.8 Create `src/viewers/environment/env-renderer.ts` — `ToolRenderer` + `EnvRendererHandle` wrapping `createEnvScene`
- [x] 3.9 Create `src/viewers/environment/env-controls.tsx` — extracted Leva controls from old env-lab viewer
- [x] 3.10 Create `src/viewers/environment/index.ts` barrel export

## 4. Create Viewers Barrel Export

- [x] 4.1 Create `src/viewers/index.ts` re-exporting stage renderers, environment module, and shared utilities

## 5. Move UI Components

- [x] 5.1 Move `src/components/ui/*.tsx` → `src/ui/components/*.tsx`, update import paths
- [x] 5.2 Move `src/hooks/use-mobile.ts` → `src/ui/hooks/use-mobile.ts`
- [x] 5.3 Move `src/lib/utils.ts` → `src/ui/lib/utils.ts`
- [x] 5.4 Update `components.json` to point ShadCN CLI at `src/ui/components/`

## 6. Consolidate Workbench

- [x] 6.1 Create `src/workbench/types.ts` with `InvariantResult`, `WorkbenchState`, `FixtureSection`, `ToolSection`, `WorkbenchSection`
- [x] 6.2 Create `src/workbench/workbench-shell.tsx` — merged gallery shell + tool section support for environment presets
- [x] 6.3 Update `src/workbench/main.tsx` to import `WorkbenchShell` instead of old gallery shell
- [x] 6.4 Update `src/workbench/index.html` entry point

## 7. Delete Old Entry Points

- [x] 7.1 Delete `src/gallery/index.html`, `src/gallery/main.tsx`, `src/gallery/gallery-shell.tsx`, `src/gallery/types.ts`
- [x] 7.2 Delete `src/env-lab/index.html`, `src/env-lab/viewer/main.tsx`
- [x] 7.3 Delete `src/facade-lab/index.html`, `src/facade-lab/index.ts`, `src/facade-lab/viewer/main.tsx`
- [x] 7.4 Delete `src/plot-lab/index.html`, `src/plot-lab/viewer/main.tsx`, `src/plot-lab/viewer/plot-canvas.tsx`
- [x] 7.5 Delete `src/rendering/index.ts`

## 8. Update Configuration

- [x] 8.1 Update `vite.config.ts` — remove gallery, env-lab, facade-lab, plot-lab from rollup inputs
- [x] 8.2 Update `package.json` — remove `dev:gallery`, `dev:env-lab`, `dev:facade-lab`, `dev:plot-lab` scripts
- [x] 8.3 Update `playwright.config.ts` — point at workbench entry
- [x] 8.4 Update `components.json` — ShadCN aliases point to `src/ui/`

## 9. Update Lint Rules

- [x] 9.1 Update `no-internal-module-imports.mjs` — replace gallery/env-lab/facade-lab/plot-lab/rendering with `viewers`
- [x] 9.2 Update `no-three-outside-rendering.mjs` — replace five directory entries with `viewers`

## 10. Update Tests

- [x] 10.1 Rename `src/gallery/gallery.spec.ts` → `src/workbench/workbench.spec.ts`, update URLs and test IDs
- [x] 10.2 Add environment tool section tests (env presets in sidebar, click without crash, fixture↔env switching)
- [x] 10.3 Move `src/facade-lab/data-source.test.ts` → `src/viewers/stages/facade-data.test.ts`, update imports

## 11. Verification

- [x] 11.1 Run `npm run lint` — all files pass linting
- [x] 11.2 Run `npx vitest run` — all unit tests pass
- [x] 11.3 Verify `npm run dev` serves workbench with all fixture stages + environment tool section
