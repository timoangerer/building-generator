## Context

The project skeleton delivered a working end-to-end pipeline with typed contracts, Zod schemas, test infrastructure, and a Three.js workbench. All generator stages exist but produce trivial output: hardcoded plots, fixed floor counts, no facade placements. The pipeline runs and renders, but the scene is three identical boxes with no facade detail.

The contracts, utilities (seeded RNG, vec2 math, wall-local-to-world), test factory, and orchestrator are all in place and do not need changes. This is purely a generator logic and workbench rendering upgrade.

## Goals / Non-Goals

**Goals:**
- Every generator uses seeded RNG — changing the seed visibly changes the output
- Plot subdivision produces varying-width plots packed into two rows
- Massing uses random floor counts and height variation per building
- Party walls between adjacent buildings are detected and annotated
- Facade generator places windows and doors in a grid-bay pattern on exposed walls
- Workbench renders facade elements as instanced meshes with per-building color variation
- All invariants from the spec are tested across multiple seeds

**Non-Goals:**
- Irregular (non-rectangular) plot shapes
- L-shaped or setback building footprints
- Procedural element geometry (all elements remain boxes)
- Style assignment or material variation beyond simple hue shift
- Multi-block or multi-street layouts
- Performance optimization (instancing is sufficient for v1 scale)

## Decisions

### 1. Plot subdivision: greedy left-to-right packing

Pack plots left-to-right along X with random widths in [minPlotWidth, maxPlotWidth]. The last plot absorbs remaining width (clamped to minPlotWidth). This is the simplest approach that produces visual variety.

**Alternative considered**: Even subdivision with random jitter — rejected because it produces less variety and doesn't exercise the contract's width range semantics.

### 2. Party wall detection: axis-aligned shared-edge check

Since all v1 plots are axis-aligned rectangles, party wall detection simplifies to: two walls share the same X or Z coordinate (within epsilon) and overlap in the other axis. This avoids the complexity of general collinear-segment intersection.

**Alternative considered**: General collinear segment overlap — deferred to when non-axis-aligned plots are introduced.

### 3. Facade placement: per-building floor arrays

The current orchestrator passes only the first building's floors to the facade generator. This needs to change: each building may have different floor counts, so the facade generator should receive per-wall floor info from the building's own massing. The orchestrator will be updated to call `generateFacade` once per building (or pass all buildings' data).

**Decision**: Update the orchestrator to call `generateFacade` per building, passing that building's walls and floors. This keeps the facade generator's interface clean (it doesn't need to correlate walls to buildings to floors).

### 4. Workbench element rendering: InstancedMesh grouped by elementId

Group all ElementPlacements across all buildings by elementId. For each group, create one InstancedMesh with a BoxGeometry matching the element catalog dimensions. Set instance transforms from position + rotationY. This gives good batching without complexity.

### 5. Per-building color: seeded hue shift from base warm tone

Use the building index and seed to compute a small hue shift (±15°) from a base warm color (HSL ~30°, 50% saturation, 65% lightness). This produces subtle variety without looking random.

## Risks / Trade-offs

- **Last-plot width clamping**: If remaining width < minPlotWidth, the last plot will be smaller than the configured minimum. This is acceptable for v1 — the invariant tests document this exception explicitly.
- **Per-building facade calls**: Calling generateFacade N times (once per building) is slightly less efficient than a single batch call, but keeps the interface simpler and N is small (~10 buildings).
- **Axis-aligned party wall assumption**: Will need reworking when non-rectangular plots are introduced. Acceptable since that's a non-goal for v1.
