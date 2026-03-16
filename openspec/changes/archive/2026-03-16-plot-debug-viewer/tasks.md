## 1. Entry Point Setup

- [x] 1.1 Create `plot-lab.html` (copy env-lab.html pattern, point to `src/plot-lab/viewer/main.tsx`)
- [x] 1.2 Create `vite.plot-lab.config.ts` (copy env-lab vite config, set input to `plot-lab.html`)
- [x] 1.3 Add `dev:plot-lab` script to `package.json`

## 2. Canvas Renderer

- [x] 2.1 Create `src/plot-lab/viewer/main.tsx` — React root that mounts a full-screen canvas and control panel overlay
- [x] 2.2 Create `src/plot-lab/viewer/plot-canvas.tsx` — React component managing an HTML Canvas 2D element, accepting `PlotResult` as prop, handling world-to-screen coordinate mapping (X→screenX, Z→screenY), auto-fit on data change
- [x] 2.3 Implement plot rendering: fill each plot rectangle with row-based colors (warm hues for Row A, cool hues for Row B, varied shades per plot), draw stroke outlines
- [x] 2.4 Implement plot ID labels: render plot ID text centered in each rectangle, skip when too small to read
- [x] 2.5 Implement street rendering: draw street rectangles in neutral gray with label

## 3. Pan and Zoom

- [x] 3.1 Add mouse-wheel zoom (scale around cursor position)
- [x] 3.2 Add click-drag panning
- [x] 3.3 Implement auto-fit function that calculates scale and offset to show all geometry with padding, called on initial load and config changes

## 4. Control Panel

- [x] 4.1 Create `src/plot-lab/viewer/control-panel.tsx` — Tailwind-styled overlay panel with inputs for all `PlotConfig` fields (seed, streetLength, streetWidth, plotDepth, minPlotWidth, maxPlotWidth)
- [x] 4.2 Wire config changes to regenerate `PlotResult` via `generatePlots()` and re-render canvas with auto-fit

## 5. Verification

- [x] 5.1 Run `npm run lint` and fix any violations
- [x] 5.2 Manually verify: dev server starts, plots render with correct colors/labels, config changes regenerate, pan/zoom works
