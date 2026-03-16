## 1. Shared Fixture Types and Module Structure

- [x] 1.1 Create `src/test-fixtures/types.ts` with `Invariant<T>` and `GeneratorFixture<TConfig, TResult>` types
- [x] 1.2 Create `src/test-fixtures/index.ts` with re-exports and empty `allFixtures` array placeholder

## 2. Per-Stage Fixture Files

- [x] 2.1 Create `src/test-fixtures/plot-fixtures.ts` — extract configFactory, seeds, and invariants from `plot-generator.test.ts`
- [x] 2.2 Create `src/test-fixtures/massing-fixtures.ts` — extract from `massing-generator.test.ts`
- [x] 2.3 Create `src/test-fixtures/element-fixtures.ts` — extract from `element-generator.test.ts`
- [x] 2.4 Create `src/test-fixtures/facade-fixtures.ts` — extract from `facade-generator.test.ts`
- [x] 2.5 Create `src/test-fixtures/building-fixtures.ts` — extract from `building-assembler.test.ts`
- [x] 2.6 Create `src/test-fixtures/pipeline-fixtures.ts` — extract from `city-pipeline.test.ts`
- [x] 2.7 Update `src/test-fixtures/index.ts` to import all fixtures and populate `allFixtures` array

## 3. Test Infrastructure Update

- [x] 3.1 Update `testGeneratorInvariants` in `src/test-utils/generator-test-factory.ts` to accept `GeneratorFixture` directly (alongside existing options shape)
- [x] 3.2 Refactor `src/generators/plot/plot-generator.test.ts` to import fixture and call `testGeneratorInvariants(plotFixture)`
- [x] 3.3 Refactor `src/generators/massing/massing-generator.test.ts` to use shared fixture
- [x] 3.4 Refactor `src/generators/element/element-generator.test.ts` to use shared fixture
- [x] 3.5 Refactor `src/generators/facade/facade-generator.test.ts` to use shared fixture
- [x] 3.6 Refactor `src/generators/building/building-assembler.test.ts` to use shared fixture
- [x] 3.7 Refactor `src/orchestrator/city-pipeline.test.ts` to use shared fixture
- [x] 3.8 Run `npm test` — verify all existing tests still pass with same count

## 4. Gallery Entry Point and Shell

- [x] 4.1 Create `gallery.html` entry point
- [x] 4.2 Create `vite.gallery.config.ts` (following env-lab pattern)
- [x] 4.3 Create `src/gallery/types.ts` with gallery-specific types (`StageRenderer`, `RenderOptions`, `GalleryState`)
- [x] 4.4 Create `src/gallery/main.tsx` — React app entry point importing `allFixtures`
- [x] 4.5 Create `src/gallery/gallery-shell.tsx` — sidebar + viewport + inspector layout using ShadCN/Tailwind
- [x] 4.6 Add `"dev:gallery"` script to `package.json`

## 5. Per-Stage Renderers

- [x] 5.1 Create `src/gallery/renderers/scene-renderer.ts` — extract `buildThreeScene` from workbench into `StageRenderer` interface
- [x] 5.2 Create `src/gallery/renderers/plot-renderer.ts` — top-down 2D view of plot footprints
- [x] 5.3 Create `src/gallery/renderers/massing-renderer.ts` — 3D box volumes with floor lines
- [x] 5.4 Create `src/gallery/renderers/element-renderer.ts` — single element, color-coded by role
- [x] 5.5 Create `src/gallery/renderers/facade-renderer.ts` — facade wall with element placements

## 6. Gallery Controls and Interactivity

- [x] 6.1 Create `src/gallery/control-bar.tsx` — wireframe toggle, color mode selector, bounds overlay, JSON inspector toggle, seed stepper
- [x] 6.2 Wire sidebar selection to run generator + render result + run invariants
- [x] 6.3 Add invariant badge display (pass/fail per invariant + summary count)
- [x] 6.4 Add JSON inspector panel (collapsible, shows full typed result)
- [x] 6.5 Implement `window.__galleryState` exposure with stage, seed, config, result, and invariant results

## 7. Verification

- [x] 7.1 Run `npm test` — all tests pass
- [x] 7.2 Run `npm run dev:gallery` — gallery opens, sidebar lists all stages and seeds
- [x] 7.3 Click through each stage/seed — renders correctly with invariant badges
- [x] 7.4 Verify controls work: wireframe, color modes, seed stepper
- [x] 7.5 Verify `window.__galleryState` returns structured data in browser console
- [x] 7.6 Run `npm run lint` — no violations
