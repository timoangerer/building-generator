## Why

The project-skeleton change delivered stubs that validate against schemas but produce trivial output: the plot generator returns 3 hardcoded plots, the massing generator ignores the random floor-count range and height variation, the facade generator emits no placements, and the workbench doesn't render facade elements. The pipeline technically runs end-to-end but produces a scene with no visual richness — just a few identical boxes. Replacing stubs with real v1 logic is the prerequisite for any meaningful visual or design iteration.

## What Changes

- **Plot generator**: Replace hardcoded plots with seeded-random subdivision — two rows of varying-width plots flanking a central street
- **Massing generator**: Use seeded RNG for floor count within range, apply height variation, detect and annotate party walls between adjacent buildings
- **Facade generator**: Implement grid-bay grammar that places doors on ground floors and windows on upper floors, respecting party walls (no placements) and edge margins
- **Element catalog**: Minor dimension tweaks to match spec (wall-panel and window-large sizes); remains a static catalog
- **Building assembler + scene composer**: No functional changes needed (already correct)
- **Workbench rendering**: Add InstancedMesh rendering for facade elements, per-building color variation via seeded hue shift

## Capabilities

### New Capabilities
- `plot-generation`: Seeded random plot subdivision into two rows flanking a street
- `massing-generation`: Per-plot floor count variation, height variation, party wall detection
- `facade-generation`: Grid-bay facade grammar placing windows and doors on exposed walls
- `workbench-rendering`: Facade element visualization via InstancedMesh, per-building color variation

### Modified Capabilities
- `stub-generators`: Requirements evolve from "return valid but trivial output" to "return procedurally generated output with invariants on layout, overlap, and placement correctness"

## Impact

- **Generators** (`src/generators/plot/`, `massing/`, `facade/`, `element/`): Core logic rewritten
- **Workbench** (`src/workbench/main.tsx`): Rendering additions for facade elements and color variation
- **Tests**: Invariant tables expanded significantly for each generator
- **Contracts**: No schema changes expected — existing types already accommodate the v1 logic
- **Orchestrator**: May need minor updates if per-building floors are passed to facade generator (currently passes only first building's floors)
