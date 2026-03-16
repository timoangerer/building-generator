## Context

The project has a clean data-first generator pipeline (plot → massing → facade → element → building → scene) where each stage is a pure function producing typed data validated by Zod schemas. Testing uses a `testGeneratorInvariants` factory for schema validation + invariant checks across seeds. The workbench viewer renders a full scene with hardcoded seed 42 and no connection to test fixtures.

Currently, adding a new test case requires editing a `.test.ts` file. Visually inspecting the same configuration requires separately setting up the workbench. There's no way to browse all generator outputs side by side or correlate test results with visual output.

## Goals / Non-Goals

**Goals:**
- Single source of truth for test configurations: one fixture definition drives both Vitest CLI tests and browser gallery
- Interactive gallery for browsing all generator stages, seeds, and invariant results
- Agent-navigable gallery with structured data exposure via `window.__galleryState`
- Per-stage renderers that show meaningful visualizations for each pipeline step (not just the final scene)

**Non-Goals:**
- Playwright visual regression tests (deferred to a future change)
- Replacing the existing workbench — it remains as the "full scene" entry point
- Supporting non-generator visualizations (env-lab stays separate)
- Production-quality gallery design — functional UI using ShadCN defaults is sufficient

## Decisions

### 1. Shared fixture module at `src/test-fixtures/`

**Decision:** Create a `GeneratorFixture<TConfig, TResult>` type that bundles name, stage key, generator fn, schema, configFactory, seeds, and invariants. Each stage gets a fixture file. An `allFixtures` array re-exports them all.

**Rationale:** The fixture is the natural bridge. Both consumers (Vitest and gallery) need the same data: which generator to call, with what config, and what to check. Putting this in a shared module eliminates duplication without coupling the consumers.

**Alternative considered:** Keep invariants in test files and have the gallery duplicate them — rejected because it breaks the "write once" goal.

### 2. Gallery as a separate Vite entry point (not integrated into workbench)

**Decision:** New `gallery.html` + `vite.gallery.config.ts` + `src/gallery/` following the env-lab pattern.

**Rationale:** The gallery has a fundamentally different UI model (sidebar + multi-stage browsing) vs the workbench (single scene viewer). Separate entry points keep each focused. They can share renderers.

**Alternative considered:** Extending the workbench with a sidebar/gallery mode — rejected because it would complicate the workbench's simple "show the scene" purpose.

### 3. Per-stage renderers with a common interface

**Decision:** Each pipeline stage gets a renderer implementing `StageRenderer<T>` with `mount`, `update`, `dispose`. The scene renderer is extracted from the existing workbench `buildThreeScene`.

**Rationale:** Different stages need different visualizations: plots are best viewed top-down 2D, massing needs 3D boxes, elements need color-coded single-item views. A common interface lets the gallery swap renderers by stage.

### 4. Gallery runs invariants live in the browser

**Decision:** When a fixture case is selected, the gallery runs all its invariant `check` functions against the generated result and displays pass/fail badges.

**Rationale:** This is the same code path as Vitest's invariant checks — the gallery just presents results visually instead of as test output. No additional testing logic needed.

### 5. `testGeneratorInvariants` accepts `GeneratorFixture` directly

**Decision:** Add an overload that accepts a `GeneratorFixture` (which has the same shape as the existing options). Existing call sites keep working.

**Rationale:** Backward compatibility during migration. Test files can be refactored one at a time to use fixtures.

## Risks / Trade-offs

- **[Fixture module becomes a bottleneck]** → Mitigation: Keep fixtures as thin data declarations with no logic beyond the invariant check functions. The generator imports go one-way (fixture imports generator, never reverse).
- **[Gallery renderer diverges from workbench]** → Mitigation: Extract shared scene rendering into `scene-renderer.ts` used by both. The workbench becomes a thin wrapper around the scene renderer.
- **[Bundle size of gallery grows]** → Mitigation: Gallery is a dev tool, not shipped to production. No concern about bundle size.
- **[Invariant checks in browser have different behavior than Node]** → Mitigation: Invariant checks are pure functions operating on plain data — no Node-specific APIs. If a check passes in Vitest, it will pass in the browser.
