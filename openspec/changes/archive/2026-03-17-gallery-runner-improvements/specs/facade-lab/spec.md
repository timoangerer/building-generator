# facade-lab Specification

## Purpose
Interactive 2D debug viewer for facade decomposition, rendering wall facades with element placements on a Canvas 2D surface with wireframe and rendered modes.
## ADDED Requirements
### Requirement: Public API barrel export
The facade-lab module SHALL export its core rendering function and types from `src/facade-lab/index.ts` so that other modules (e.g., gallery renderers) can reuse the 2D facade rendering logic without importing internal paths.

#### Scenario: renderFacade2D is importable from barrel
- **WHEN** a module imports `renderFacade2D` from `@/facade-lab`
- **THEN** it SHALL receive the 2D canvas rendering function

#### Scenario: Types are importable from barrel
- **WHEN** a module imports `ViewMode` and `FacadeLabView` from `@/facade-lab`
- **THEN** it SHALL receive the view mode enum/type and the facade view data structure

## Unchanged Requirements
### Requirement: Separate Vite entry point
The facade lab SHALL have its own HTML shell and dev script served by the unified Vite config.

### Requirement: Data source layer
The facade lab SHALL expose a pure data layer with `getFacadeLabData(seed)` and `getWallFacadeView(seed, buildingIndex, wallIndex)`.

### Requirement: 2D canvas rendering
The facade lab SHALL render facades using the HTML5 Canvas 2D API.

### Requirement: Wireframe mode
In wireframe mode, the renderer SHALL draw floor lines, bay grid, element bounding rectangles with labels, and dimension annotations.

### Requirement: Rendered mode
In rendered mode, the renderer SHALL draw wall background, grid overlay, and element composite parts as colored rectangles.

### Requirement: Control panel
The viewer SHALL include a control panel with seed input, building/wall dropdowns, mode toggle, and info readout.
