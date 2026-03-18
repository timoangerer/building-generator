# plot-lab Specification

## Purpose
Interactive debug viewer for the plot generator — standalone entry point removed, plot rendering accessible through the workbench's plot stage renderer.

## MODIFIED Requirements

### Requirement: Standalone entry point removed
The standalone `src/plot-lab/index.html` entry point, `src/plot-lab/viewer/main.tsx`, `src/plot-lab/viewer/plot-canvas.tsx`, and `dev:plot-lab` npm script SHALL be removed. Plot visualization is accessible only through the workbench's plot stage renderer.

#### Scenario: No plot-lab entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `plot-lab` entry in Vite's rollup inputs

### Requirement: Plot rendering preserved
The plot stage renderer under `src/viewers/stages/plot-renderer.ts` SHALL continue to render `PlotResult` data as a top-down 2D canvas with row-based coloring, plot ID labels, and street rendering.

#### Scenario: Plot renderer accessible from workbench
- **WHEN** the workbench selects a plot fixture
- **THEN** the plot renderer SHALL display the plot result in the viewport
