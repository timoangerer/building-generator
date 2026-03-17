## Context

The gallery runner is the primary visual verification tool for the building generator pipeline. It renders each pipeline stage (plot, massing, element, facade, building, pipeline) with configurable seeds and runs behavioral invariants against the results. However, the facade stage renders incorrectly (the Three.js renderer doesn't properly visualize facade data), the building stage has no renderer at all, and the fixture seeds all produce near-identical results. The gallery shell uses a custom Tailwind layout that doesn't match the project's ShadCN/ui conventions.

The facade-lab module already has a working 2D canvas renderer (`renderFacade2D`) that correctly visualizes facades. The project already uses ShadCN/ui components elsewhere. Both can be reused directly.

## Goals / Non-Goals

**Goals:**
- Fix facade visualization in the gallery by reusing the proven facade-lab 2D renderer
- Add building stage visualization so all pipeline stages are renderable
- Curate fixture seeds to showcase meaningful architectural variation
- Modernize the gallery shell to use ShadCN/ui with dark mode
- Display descriptive fixture labels instead of raw seed numbers

**Non-Goals:**
- New rendering modes or controls beyond what exists
- Performance optimization of renderers
- New test fixtures for stages other than facade
- Mobile/responsive gallery layout (ShadCN provides basic responsive behavior but we're not targeting mobile)
- Changing the gallery's spec runner or invariant checking logic

## Decisions

### 1. ShadCN Sidebar for gallery navigation

Replace the custom flexbox sidebar with `ShadCN/ui Sidebar` + `SidebarProvider`. This gives us collapsible groups, proper keyboard navigation, and consistent styling with the rest of the project. Dark mode enabled via `class="dark"` on the HTML root element.

The invariant results panel moves from a fixed right panel to a `Dialog` modal — this frees up viewport space and makes invariants available on demand rather than always visible.

### 2. Reuse facade-lab's 2D canvas renderer

Instead of fixing the broken Three.js facade renderer, replace it entirely with a 2D canvas approach that reuses `renderFacade2D` from `src/facade-lab/`. This requires:
- A new barrel export at `src/facade-lab/index.ts` exposing `renderFacade2D`, `ViewMode`, and `FacadeLabView`
- A conversion function in the facade renderer that transforms `FacadeResult` → `FacadeLabView` (extracts first non-party wall, computes element bounds, builds element catalog)

This is better than fixing the 3D renderer because facades are fundamentally 2D elevation views, and the facade-lab renderer is already tested and working.

### 3. Building renderer as simple 3D boxes

The building renderer uses Three.js (appropriate since buildings are 3D spatial objects) with a minimal approach:
- Each building rendered as a colored box with wireframe floor lines and wall outlines
- Ground plane for spatial reference
- Auto-positioned camera based on building extents
- Standard `mount/update/dispose` lifecycle matching other renderers

Deliberately simple — the goal is stage visibility in the gallery, not a production building viewer.

### 4. Curated seed-to-config mappings for facade fixtures

Replace the generic approach (all seeds → same config) with a `curatedConfigs` map where seeds 1-5 each produce a distinct wall configuration:

| Seed | Label | Width | Floors |
|---|---|---|---|
| 1 | narrow 3-floor | 8m | 3 |
| 2 | wide 3-floor | 16m | 3 |
| 3 | tall 4-floor | 10m | 4 |
| 4 | low wide | 22m | 2 |
| 5 | with party wall | 10m + 12m | 3 |

Unknown seeds fall back to a default config. This ensures the gallery shows meaningful variation when browsing facade fixtures.

### 5. Fixture labels via optional `labels` field

Add `labels?: string[]` to `GeneratorFixture` type. When present, `labels[i]` provides a human-readable name for `seeds[i]`. The gallery shell displays these in the sidebar and top bar as `stage / label` instead of `stage / seed N`.

This is optional and backward-compatible — existing fixtures without labels continue to show seed numbers.

## Risks / Trade-offs

- **ShadCN components increase bundle size**: Seven new UI component files are added. Acceptable for a dev-only gallery tool.
- **Facade renderer loses 3D capability**: The old Three.js approach could theoretically show depth. In practice it was broken and facades are better viewed as 2D elevations.
- **Curated seeds are opinionated**: Reduces randomness in favor of hand-picked variation. The trade-off is intentional — gallery is for visual verification, not randomized testing (that's what the spec runner is for).
- **Building renderer is intentionally simple**: Doesn't show individual elements or detailed geometry. Good enough for gallery stage visualization; the workbench provides the full 3D view.
