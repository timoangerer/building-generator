## 1. Plot Generator

- [x] 1.1 Implement seeded random plot subdivision in `src/generators/plot/plot-generator.ts` — greedy left-to-right packing with random widths in [minPlotWidth, maxPlotWidth], two rows (A above, B below), street centered at z=0
- [x] 1.2 Update plot generator tests with invariants: valid rectangles, no overlaps, widths in range, both rows populated, plots fill street length, deterministic

## 2. Massing Generator

- [x] 2.1 Add seeded random floor count (within floorCountRange) and height variation (±heightVariation) per building in `src/generators/massing/massing-generator.ts`
- [x] 2.2 Implement party wall detection — axis-aligned shared-edge check, set `neighborBuildingId` symmetrically on both walls
- [x] 2.3 Update massing generator tests with invariants: floor count in range, baseY monotonically increasing, party walls symmetric, walls form closed perimeter, outward normals, deterministic

## 3. Facade Generator

- [x] 3.1 Implement grid-bay facade placement in `src/generators/facade/facade-generator.ts` — compute bays from usable width, place doors on ground-floor center bay, windows elsewhere, skip party walls
- [x] 3.2 Use `wallLocalToWorld` from `src/core-geometry/wall-utils.ts` for position computation, compute rotationY from wall normal
- [x] 3.3 Update facade generator tests with invariants: party walls empty, valid element references, finite coordinates, ground floor has door, no overlapping placements, deterministic

## 4. Element Catalog

- [x] 4.1 Adjust element dimensions in `src/generators/element/element-generator.ts` to match spec (window-large height 1.4, door depth 0.05, wall-panel width 1.0 height 1.0 depth 0.02)

## 5. Orchestrator

- [x] 5.1 Update `src/orchestrator/city-pipeline.ts` to call `generateFacade` per building (passing each building's own walls and floors) instead of passing only the first building's floors

## 6. Workbench Rendering

- [x] 6.1 Add InstancedMesh rendering for facade elements in `src/workbench/main.tsx` — group placements by elementId, create one InstancedMesh per group with BoxGeometry from catalog
- [x] 6.2 Add per-building color variation — seeded hue shift (±15°) from base warm tone using building index
- [x] 6.3 Add distinct material colors for facade elements (darker for windows to suggest depth)

## 7. Verification

- [x] 7.1 Run `npm run test` — all generators validate against schemas, all invariants pass
- [x] 7.2 Run `npm run dev` — verify street scene with varied buildings, facade elements on exposed walls, no elements on party walls
- [x] 7.3 Run `npm run build` — verify no type errors
