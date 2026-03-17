# facade-lab Specification

## Purpose
2D facade rendering and data source utilities for visualizing facade decomposition — now located under `src/viewers/stages/` with standalone entry point removed.
## Requirements
### Requirement: Module location
The facade canvas renderer SHALL reside at `src/viewers/stages/facade-canvas.ts`. The facade data source SHALL reside at `src/viewers/stages/facade-data.ts` with its test at `src/viewers/stages/facade-data.test.ts`.

#### Scenario: Facade canvas importable from viewers
- **WHEN** a module imports the facade canvas rendering function
- **THEN** it SHALL import from `src/viewers/stages/facade-canvas.ts`

### Requirement: Standalone entry point removed
The standalone `src/facade-lab/index.html` entry point, `src/facade-lab/index.ts` barrel export, `src/facade-lab/viewer/main.tsx`, and `dev:facade-lab` npm script SHALL be removed. Facade visualization is accessible only through the workbench's facade stage renderer.

#### Scenario: No facade-lab entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `facade-lab` entry in Vite's rollup inputs

### Requirement: Data source layer preserved
The `getFacadeLabData(seed)` and `getWallFacadeView(seed, buildingIndex, wallIndex)` functions SHALL continue to work identically from their new location at `src/viewers/stages/facade-data.ts`. The facade lab SHALL expose a pure data layer with `getFacadeLabData(seed)` returning building/wall listings and `getWallFacadeView(seed, buildingIndex, wallIndex)` returning a `FacadeLabView` with wall, floors, bay dimensions, placements, element catalog, and computed metrics.

#### Scenario: Data source returns valid structure
- **WHEN** `getWallFacadeView` is called with a valid seed, building index, and wall index
- **THEN** the returned `FacadeLabView` SHALL contain `wall`, `floors`, `bayWidth`, `edgeMargin`, `placements`, `elementCatalog`, `bayCount`, and `usableWidth`

#### Scenario: Data source is deterministic at new location
- **WHEN** `getWallFacadeView` is called twice with the same arguments from the new module path
- **THEN** both results SHALL be deeply equal

#### Scenario: Bay count matches usable width
- **WHEN** a `FacadeLabView` is returned
- **THEN** `bayCount` SHALL equal `floor(usableWidth / bayWidth)` and `usableWidth` SHALL equal `wall.length - 2 * edgeMargin`

### Requirement: 2D canvas rendering
The facade lab SHALL render facades using the HTML5 Canvas 2D API with coordinate system X = along wall (0 → wall.length), Y = vertical (0 → totalHeight), with canvas transforms handling viewport fitting.

#### Scenario: Canvas renders facade data
- **WHEN** `renderFacade2D` is called with a canvas context and a `FacadeLabView`
- **THEN** it SHALL draw the facade without errors and fill the canvas viewport

### Requirement: Wireframe mode
In wireframe mode, the renderer SHALL draw floor lines, bay grid lines, edge margins (dashed), element bounding rectangles with elementId labels, and dimension annotations showing bay width, floor height, and element width × height.

#### Scenario: Wireframe shows bay grid
- **WHEN** the viewer is in wireframe mode
- **THEN** vertical bay divider lines and horizontal floor lines SHALL be visible

#### Scenario: Wireframe shows element labels
- **WHEN** the viewer is in wireframe mode
- **THEN** each element bounding rectangle SHALL display the elementId as a text label

### Requirement: Rendered mode
In rendered mode, the renderer SHALL draw the wall background in a light color, a subtle gray grid overlay, and each element's composite geometry parts as colored rectangles using palette colors from the element catalog.

#### Scenario: Rendered mode uses palette colors
- **WHEN** the viewer is in rendered mode
- **THEN** each drawn element part SHALL use the color mapped to its role in the catalog's `defaultPalette`

### Requirement: Control panel
The viewer SHALL include a ShadCN/Tailwind control panel with: seed input, building dropdown, wall dropdown (filtered to exposed walls with wall length shown), wireframe/rendered toggle, and an info readout showing bay count, usable width, floor count, and element types used.

#### Scenario: Wall dropdown filters party walls
- **WHEN** the building dropdown is changed
- **THEN** the wall dropdown SHALL only show walls without `neighborBuildingId` set

#### Scenario: State changes trigger re-render
- **WHEN** any control panel input changes (seed, building, wall, mode)
- **THEN** the canvas SHALL re-render with the updated data
