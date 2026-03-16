## Why

The plot generator produces structured data (plots with footprints, streets, building IDs, rows) but there is no way to visually inspect this data in isolation. Debugging plot generation currently requires running the full pipeline and inferring plot layout from 3D building geometry. A dedicated 2D debug viewer would make plot data directly inspectable — seeing building rectangles, their IDs, row assignments, street boundaries, and how plots tile along the street.

## What Changes

- Add a new **plot-lab** frontend entry point (following the env-lab pattern) with a 2D top-down canvas view
- Render each plot footprint as a colored rectangle, labeled with its plot ID and building ID
- Render streets with distinct coloring and labels
- Color-code by row (A vs B) so spatial organization is immediately visible
- Include a control panel for adjusting `PlotConfig` parameters (seed, street length, plot depth, min/max width) and regenerating live
- Show plot bounds, footprint vertices, and neighbor relationships as optional overlays

## Capabilities

### New Capabilities
- `plot-lab`: A dedicated 2D debug viewer for inspecting plot generator output — renders plots as colored rectangles with IDs, streets with distinct styling, and provides interactive config controls for regeneration.

### Modified Capabilities

(none)

## Impact

- New files: `plot-lab.html`, `vite.plot-lab.config.ts`, `src/plot-lab/` directory
- New npm script: `dev:plot-lab`
- No changes to existing generators, contracts, or the workbench
- Depends on: `src/generators/plot/` public API, `src/contracts/plot.ts` types
