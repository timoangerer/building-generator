## Why

The facade generator currently produces monotonous results (only uses the first window/door from the catalog), has unrealistic proportions (windows 0.6m wide in 2.5m bays look tiny and far apart), and there's no way to inspect facades in isolation. We need a dedicated 2D viewer to reason about facades, realistic element sizing, and more varied generation rules.

## What Changes

- **New `src/facade-lab/` module**: A dedicated 2D facade inspection tool with wireframe and rendered modes, following the env-lab pattern (separate Vite entry point, standalone dev server)
- **New element bounds utility**: `computeElementBounds` function to calculate axis-aligned bounding boxes from composite element geometry — needed by both the 2D renderer and proportion logic
- **Resized element definitions**: Scale up Mediterranean window elements to realistic residential dimensions (e.g. window-tall from 0.6×1.3 to 0.9×1.6)
- **Element selection variety**: Replace "always pick first window/door" with seeded per-building primary/accent window selection and per-floor placement rules
- **Y-position refinement**: Doors bottom-aligned to floor base, windows placed at realistic sill height (~0.9m above floor)
- **Optional proportional scaling**: New `scale` field on `ElementPlacement` as a safety net for elements that don't fill their bay well
- **Bay grid inspection artifact**: Expose the intermediate bay assignment grid on `WallFacade` for debugging

## Capabilities

### New Capabilities
- `facade-lab`: Standalone 2D facade debug viewer with wireframe/rendered modes, data source layer, and ShadCN control panel for inspecting facades by seed/building/wall
- `element-bounds`: Utility to compute axis-aligned bounding boxes from composite element geometry parts

### Modified Capabilities
- `composite-element-geometry`: Window element dimensions scaled up to realistic Mediterranean residential proportions
- `pipeline-contracts`: `ElementPlacement` gains optional `scale: Vec3`; `WallFacade` gains optional `bayGrid` inspection array
- `facade-generation`: Element selection uses seeded variety (primary/accent windows, per-floor rules); Y-position uses sill height for windows and floor-base for doors; optional proportional scaling
- `workbench-rendering`: Apply `placement.scale` to instance transforms when present

## Impact

- **New files**: `facade-lab.html`, `vite.facade-lab.config.ts`, `src/facade-lab/` module (data source, renderer, viewer), `src/generators/element/element-bounds.ts`
- **Modified contracts**: `src/contracts/facade.ts` and `facade.schema.ts` (backward-compatible additions)
- **Modified generators**: `src/generators/element/element-generator.ts` (resize), `src/generators/facade/facade-generator.ts` (variety + positioning)
- **Modified renderer**: `src/workbench/main.tsx` (apply scale)
- **New dev script**: `dev:facade-lab` in `package.json`
- **Test updates**: element dimension assertions, new facade invariants (variety, positioning, bay grid)
