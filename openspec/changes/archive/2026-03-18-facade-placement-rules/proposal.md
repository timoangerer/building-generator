## Why

The facade generator places elements at hardcoded positions (center of bay horizontally, sill-height or floor-base vertically) without checking whether they fit within their tile (bay × floor cell). This causes visible bugs: balcony doors overflow into adjacent floors because their bounding box offset isn't accounted for, arched windows poke above tile boundaries, and doors sometimes float above the floor base. There is no mechanism to describe **how** an element should be anchored within its tile, and no verification that elements stay within bounds.

## What Changes

- **Introduce an anchor/origin placement model** for positioning elements within tiles. Each element type gets a default placement rule (e.g., doors snap to bottom-center, windows sit at sill height), and grammar rules can override per-tile.
- **Account for bounding box offset** in position computation. Currently `bounds.offsetY` is computed but ignored by the facade generator, causing misalignment for composite elements whose origin differs from their bbox center (balconies, arched elements).
- **Add a containment verifier** that runs after placement and reports warnings for elements that overflow their tile boundaries. Warnings are inspectable data, not hard errors — they appear in the workbench and are checkable via invariant tests.
- **Add placement-focused invariant tests** that verify: no tile overflow beyond tolerance, correct anchor alignment for doors/windows, all bays populated (or explicitly marked empty).

## Capabilities

### New Capabilities
- `tile-placement`: Anchor/origin placement model for positioning elements within bay×floor tiles, including offset support and element-type defaults.
- `placement-verification`: Post-placement containment checker that produces inspectable warnings for overflow, misalignment, and empty bays.

### Modified Capabilities
- `facade-generation`: Position computation must use the new tile-placement model instead of hardcoded Y-position logic. WallFacade gains optional `warnings` field.

## Impact

- **Contracts**: `ElementPlacement` may gain optional anchor/origin fields. `WallFacade` gains optional `PlacementWarning[]`. New types for `Anchor`, `Origin`, `PlacementRule`.
- **Core geometry**: `element-bounds.ts` already computes offsets — no changes needed, but the facade generator must actually use `offsetX`/`offsetY`.
- **Facade generator**: `facade-generator.ts` position computation refactored to use placement resolver instead of inline math.
- **Test fixtures**: New invariants added to `facade-fixtures.ts` for containment and anchor correctness.
- **Workbench**: Warnings surfaced in the existing invariant display.
