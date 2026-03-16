## ADDED Requirements

### Requirement: Standalone entry point
The plot-lab SHALL be a standalone frontend entry point with its own HTML file (`plot-lab.html`), Vite config (`vite.plot-lab.config.ts`), and npm script (`dev:plot-lab`), following the env-lab pattern.

#### Scenario: Dev server launches plot-lab
- **WHEN** the user runs `npm run dev:plot-lab`
- **THEN** the browser SHALL open to `plot-lab.html` showing the plot debug viewer

### Requirement: 2D top-down plot rendering
The plot-lab SHALL render all plots from a `PlotResult` as filled rectangles on an HTML Canvas 2D context, viewed from top-down. The X axis of plot data SHALL map to the horizontal canvas axis, and the Z axis SHALL map to the vertical canvas axis.

#### Scenario: Plots rendered as rectangles
- **WHEN** the plot-lab loads with a default seed
- **THEN** every plot in the `PlotResult` SHALL appear as a visible filled rectangle on the canvas

#### Scenario: Coordinate mapping preserves layout
- **WHEN** two plots are adjacent along X in the data
- **THEN** they SHALL appear horizontally adjacent on the canvas

### Requirement: Row-based color coding
The plot-lab SHALL color plots by their row assignment. Row A plots SHALL use a distinct color family from Row B plots. Each individual plot SHALL have a slightly varied shade within its row's color family so adjacent plots are visually distinguishable.

#### Scenario: Row A and Row B are visually distinct
- **WHEN** the canvas renders plots from both rows
- **THEN** Row A plots SHALL use a warm color family and Row B plots SHALL use a cool color family

#### Scenario: Adjacent plots distinguishable
- **WHEN** two adjacent plots share a row
- **THEN** they SHALL have noticeably different shades

### Requirement: Plot ID labels
Each plot rectangle SHALL display its plot ID (e.g. "plot-A1") as a text label centered within the rectangle.

#### Scenario: Labels visible at default zoom
- **WHEN** the canvas renders at default zoom level
- **THEN** every plot SHALL show its ID as readable text inside the rectangle

### Requirement: Street rendering
Streets from the `PlotResult` SHALL be rendered as filled rectangles in a neutral color (gray), visually distinct from plots.

#### Scenario: Street visible between rows
- **WHEN** the canvas renders a plot result with one street
- **THEN** a gray rectangle SHALL appear between Row A and Row B plots

### Requirement: Interactive config controls
The plot-lab SHALL provide a control panel allowing the user to adjust `PlotConfig` parameters: `seed`, `streetLength`, `streetWidth`, `plotDepth`, `minPlotWidth`, `maxPlotWidth`. Changing any parameter SHALL regenerate the plot result and re-render the canvas.

#### Scenario: Changing seed regenerates layout
- **WHEN** the user changes the seed value in the control panel
- **THEN** the canvas SHALL re-render with a new plot layout matching the new seed

#### Scenario: Adjusting streetLength updates view
- **WHEN** the user increases `streetLength`
- **THEN** the rendered plots SHALL extend further along the horizontal axis

### Requirement: Pan and zoom
The canvas SHALL support mouse-wheel zoom and click-drag panning so the user can explore large plot layouts.

#### Scenario: Zoom in with mouse wheel
- **WHEN** the user scrolls the mouse wheel up over the canvas
- **THEN** the view SHALL zoom in, showing more detail

#### Scenario: Pan by dragging
- **WHEN** the user clicks and drags on the canvas
- **THEN** the view SHALL pan in the drag direction

### Requirement: Auto-fit on generation
When a new `PlotResult` is generated (on load or config change), the view SHALL auto-fit to show all plots and streets with padding.

#### Scenario: All geometry visible after regeneration
- **WHEN** the plot config changes and a new result is generated
- **THEN** the canvas SHALL zoom and pan to fit all plots and streets within the viewport
