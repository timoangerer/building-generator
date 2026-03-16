## Why

Test cases define interesting configurations (seeds, configs, invariants) and viewers visualize generator output, but they are completely disconnected. Adding a new test case means duplicating configuration in both Vitest tests and the workbench viewer. The goal is to write a test case once and have it be both automatically verifiable (headless CLI/CI) and visually inspectable (interactive 3D browser UI) — with zero duplication.

## What Changes

- **Shared fixture module** (`src/test-fixtures/`): Extract seeds, configs, and invariants from individual `.test.ts` files into shared `GeneratorFixture` objects. Test files shrink to a single import + `testGeneratorInvariants(fixture)` call. The fixture becomes the single source of truth for both Vitest and the gallery.
- **Gallery viewer** (`src/gallery/`): New Vite entry point with React-based gallery shell — sidebar listing all fixtures/seeds, 3D/2D viewport with OrbitControls, live invariant badges, JSON inspector, and render controls (wireframe, color mode, bounds).
- **Per-stage renderers**: Typed renderer for each pipeline stage (plot, massing, element, facade, full scene) extracted from/inspired by the existing workbench renderer.
- **Agent data exposure**: `window.__galleryState` exposes structured data (stage, seed, config, result, invariant results) for Playwright MCP inspection.
- **`testGeneratorInvariants` update**: Accept `GeneratorFixture` type directly alongside existing options shape.

## Capabilities

### New Capabilities
- `test-fixtures`: Shared fixture module defining `GeneratorFixture<TConfig, TResult>` type and per-stage fixture instances used by both Vitest and the gallery
- `gallery-viewer`: Interactive browser-based gallery that renders generator outputs per-stage with live invariant checking, JSON inspection, and render controls

### Modified Capabilities
- `test-infrastructure`: `testGeneratorInvariants` updated to accept `GeneratorFixture` type directly; test files refactored to use shared fixtures

## Impact

- **Test files**: All `*.test.ts` files for generators shrink to ~3 lines (import fixture + call factory)
- **Test utils**: `generator-test-factory.ts` gains overload accepting `GeneratorFixture`
- **Workbench**: `buildThreeScene` logic extracted to a shared renderer used by both workbench and gallery
- **Build config**: New `vite.gallery.config.ts` and `gallery.html` entry point; new `dev:gallery` npm script
- **Dependencies**: ShadCN/ui components for gallery controls (already in project); no new external dependencies
