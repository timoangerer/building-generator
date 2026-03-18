## 1. Contracts & Types

- [x] 1.1 Add `Anchor` type (9 named positions) and `PlacementRule` type (`{ anchor, origin, offset? }`) to contracts
- [x] 1.2 Add `PlacementWarning` type (`{ floorIndex, bayIndex, elementId, type, overflowAmount? }`) to contracts
- [x] 1.3 Add optional `warnings: PlacementWarning[]` field to `WallFacade` type
- [x] 1.4 Update `FacadeResultSchema` (Zod) to include the new warning field

## 2. Tile Placement Resolver

- [x] 2.1 Create `src/core-geometry/tile-placement.ts` with `resolveTilePlacement(tile, bounds, rule) → { localX, localY }` pure function
- [x] 2.2 Implement anchor-point resolution: map 9 named positions to (x, y) on tile rect
- [x] 2.3 Implement origin-point resolution: map 9 named positions to (x, y) on element bbox
- [x] 2.4 Implement bounding box offset accounting (`bounds.offsetX`, `bounds.offsetY`)
- [x] 2.5 Implement element-type default rules (door → bottom-center, window → bottom-center + sill offset, wall_panel → center)
- [x] 2.6 Write tests for `resolveTilePlacement`: all 9 anchor/origin combos, offset scenarios, bbox offset correction, defaults per element type

## 3. Containment Verifier

- [x] 3.1 Create `src/core-geometry/placement-verification.ts` with `verifyPlacement(tile, bounds, position, tolerance?) → PlacementWarning[]`
- [x] 3.2 Implement overflow detection for all 4 edges (top, bottom, left, right) with tolerance
- [x] 3.3 Write tests for verifier: element within bounds (no warning), overflow each edge, within-tolerance no warning, exceeding-tolerance warning with correct amount

## 4. Facade Generator Integration

- [x] 4.1 Refactor `facade-generator.ts` position computation to call `resolveTilePlacement` instead of inline Y-position math
- [x] 4.2 Apply bounding box offset correction in world-space transform (use `bounds.offsetX`/`bounds.offsetY`)
- [x] 4.3 Run containment verifier after placement and populate `WallFacade.warnings`
- [x] 4.4 Add empty-bay detection: when element selection returns null for an exposed wall cell, emit "empty-bay" warning

## 5. Test Fixtures & Invariants

- [x] 5.1 Add invariant to `facade-fixtures.ts`: "no overflow warnings on any fixture seed" (using default tolerance)
- [x] 5.2 Add invariant: "all doors have bottom edge within 0.02m of floor base"
- [x] 5.3 Add invariant: "no empty-bay warnings on exposed walls"
- [x] 5.4 Run all existing tests — verify no regressions in the 9 existing invariants
- [x] 5.5 Run `npm run lint` and fix any violations
