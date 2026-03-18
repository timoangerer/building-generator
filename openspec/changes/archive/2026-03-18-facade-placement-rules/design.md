## Context

The facade generator divides walls into a bay × floor grid and places one element per cell. Currently, positioning is hardcoded: horizontal center of bay, vertical position based on element type (doors at `floor.baseY + bounds.height/2`, windows at `floor.baseY + 0.9 + bounds.height/2`). This ignores `bounds.offsetY` — the difference between element origin and bounding box center — causing composite elements like balconies to overflow their tiles. There is no containment checking, no way to describe alignment intent, and no warnings when things go wrong.

Key files:
- `src/generators/facade/facade-generator.ts` — placement logic (lines 203–218)
- `src/core-geometry/element-bounds.ts` — computes bounds with offset
- `src/contracts/facade.ts` — `ElementPlacement`, `WallFacade` types
- `src/test-fixtures/facade-fixtures.ts` — 9 existing invariants

## Goals / Non-Goals

**Goals:**
- Fix element overflow and misalignment bugs by accounting for bounding box offsets
- Introduce a declarative anchor/origin model so placement intent is explicit and inspectable
- Add containment verification that produces structured warnings
- Write tests that catch these classes of bugs automatically

**Non-Goals:**
- Redesigning the bay grid system or element selection logic
- Supporting overlapping elements or multi-bay spanning
- CSS-like layout features (flexbox, flow layout) — we're placing single elements in fixed cells
- Changing element geometry definitions or the element catalog

## Decisions

### Decision 1: Anchor + Origin placement model

**Choice**: Each tile placement is resolved by three things: an **anchor** (where on the tile to align), an **origin** (which point on the element bbox to use as reference), and an optional **offset** (displacement in tile-local coordinates).

**Alternatives considered**:
- *Absolute positioning only*: Simple but loses semantic intent. Can't distinguish "centered window" from "window that happens to be at center coordinates."
- *CSS box model*: Overkill — we have single elements in fixed-size cells, not flowing content.

**Rationale**: The anchor/origin model is the minimum abstraction that captures all current placement patterns (center, bottom-snap, sill-offset) while being explicit enough to verify and inspect.

**Anchor values**: `"top-left" | "top-center" | "top-right" | "middle-left" | "center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right"`

**Origin values**: Same 9 positions, but relative to the element's bounding box.

### Decision 2: Element-type defaults with rule override

**Choice**: Each `ElementType` gets a default `PlacementRule`. The facade generator uses the default unless a grammar rule overrides it for a specific tile.

Defaults:
- `door` → `{ anchor: "bottom-center", origin: "bottom-center" }` (bottom of door at bottom of tile)
- `window` → `{ anchor: "bottom-center", origin: "bottom-center", offset: { x: 0, y: sillHeight } }` (window bottom at sill height)
- `wall_panel` → `{ anchor: "center", origin: "center" }`

**Rationale**: Doors always sit on the floor. Windows always have a sill. These are architectural invariants that shouldn't need to be specified per-tile. But the system should be overridable for future grammar extensions (e.g., clerestory windows, transom placement).

### Decision 3: Pure function placement resolver

**Choice**: Extract placement resolution into a pure function `resolveTilePlacement(tile, element, rule) → { position, warnings }` that takes the tile rect, element bounds, and placement rule and returns a local position within the tile.

**Rationale**: This is the critical testable unit. By isolating it from wall-space transforms and RNG, we can write exhaustive unit tests for every anchor/origin combination. The facade generator calls this function then transforms the result to world space.

```
resolveTilePlacement(tile, bounds, rule)
  → { localX, localY }  (relative to tile bottom-left)

then: worldPos = tileBottomLeft + localX * wallDir + localY * upDir
```

### Decision 4: Containment verifier as separate pass

**Choice**: After all placements are computed, run a verification pass that checks each placement's effective bounding box against its tile rect. Produce `PlacementWarning[]` on `WallFacade`.

**Alternatives considered**:
- *Clamp elements to fit*: Hides bugs instead of surfacing them. A balcony that doesn't fit should be a visible warning, not silently truncated.
- *Reject invalid placements*: Too strict — during development we want to see what went wrong, not get empty facades.

**Rationale**: Warnings are inspectable intermediate artifacts. They appear in the workbench alongside existing invariants. Tests can assert "zero warnings" or "warnings below tolerance." This matches the project's verification strategy.

### Decision 5: Account for bounds offset in position computation

**Choice**: When computing world-space position, add `bounds.offsetX` and `bounds.offsetY` to the position. Currently `computeElementBounds` returns these offsets but `facade-generator.ts` ignores them.

**Rationale**: This is the root cause of the balcony overflow. The balcony-door-iron has a slab at `y = -doorH/2`, pulling `offsetY` negative. The placement code uses `bounds.height/2` (assuming origin = bbox center) but the actual mesh origin is above the bbox center. The fix is to shift the world position by the offset so the bbox lands where intended.

## Risks / Trade-offs

**[Risk] Changing position computation breaks existing snapshot/visual tests**
→ Mitigation: This is intentional — current positions are wrong. Run all fixtures before and after, document position deltas. The visual result should improve.

**[Risk] Anchor model adds complexity to a currently simple placement**
→ Mitigation: The defaults encode current intent. For the common case (most windows, most doors), placement is automatic. The anchor/origin is only explicitly needed for special cases.

**[Risk] Warnings may be noisy during development**
→ Mitigation: Warnings include `overflowAmount` so tests can set a tolerance (e.g., allow 0.02m overflow from normal offset). The workbench can filter/collapse warnings.
