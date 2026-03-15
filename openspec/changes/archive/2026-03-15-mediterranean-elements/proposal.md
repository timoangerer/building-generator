## Why

The element catalog currently contains only 4 plain box-geometry elements (two windows, one door, one wall panel) with no visual character. To test that the pipeline can handle varied, composite assets — and to move toward a Mediterranean coastal aesthetic — the element generator needs to produce richer, self-contained elements built from multiple geometric primitives with role-based coloring.

## What Changes

- Extend `ElementGeometry` to support **composite geometry**: multiple parts (box, half-cylinder) with positional offsets and semantic role tags (`pane`, `frame`, `shutter`, `sill`, `panel`, `railing`, `slab`).
- Add `"balcony"` as a new `ElementType`.
- Replace the current 4-element catalog with **~9 Mediterranean-style elements**: 5 windows (tall, arched, shuttered, arched-shuttered, small square), 2 doors (arched entry, paneled), 2 balcony-door assemblies (French door + iron balcony, French door + stone balcony). Each element is a **finished, self-contained asset** — balcony doors include the balcony geometry as part of the element, not as a separate attachable piece.
- Introduce a **role→color palette** system so the renderer can color element parts by semantic role (e.g., shutters get accent color, panes get glass color) rather than by element type.
- Update the workbench renderer to interpret composite geometry and apply role-based coloring.
- Update Zod validation schemas to cover the new geometry and type variants.

## Capabilities

### New Capabilities
- `composite-element-geometry`: Defines the composite geometry contract (multi-part elements with shapes, offsets, roles) and the element generator's ability to produce Mediterranean-style elements as self-contained assets.
- `element-role-palettes`: Defines the role→color palette system for coloring element parts by semantic role.

### Modified Capabilities
- `pipeline-contracts`: ElementType gains `"balcony"` variant; ElementGeometry gains `"composite"` variant alongside existing `"box"`.
- `workbench-rendering`: Renderer must interpret composite geometry parts and apply role-based colors from palettes.

## Impact

- **Contracts**: `src/contracts/element.ts` and `element.schema.ts` — new types, extended unions.
- **Element generator**: `src/generators/element/element-generator.ts` — rewrite catalog construction to produce composite elements.
- **Element tests**: `src/generators/element/element-generator.test.ts` — updated for new catalog shape.
- **Workbench renderer**: `src/workbench/main.tsx` — composite mesh construction, role-based material assignment.
- **Facade generator**: No changes required. It already references elements by ID and places them by position/rotation. New element types slot in transparently.
- **No breaking changes** to the placement contract (`ElementPlacement`). Existing facade logic continues to work.
