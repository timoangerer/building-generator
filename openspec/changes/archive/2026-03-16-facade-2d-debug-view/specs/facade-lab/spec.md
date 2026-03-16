# facade-lab Specification

## Purpose
Standalone 2D facade debug viewer with wireframe and rendered modes for inspecting generated facades in isolation.

## ADDED Requirements

### Requirement: Separate Vite entry point
The facade lab SHALL have its own HTML shell (`facade-lab.html`), Vite config (`vite.facade-lab.config.ts`), and dev script (`dev:facade-lab`) following the env-lab pattern.

#### Scenario: Dev server launches facade lab
- **WHEN** `npm run dev:facade-lab` is executed
- **THEN** a browser SHALL open to `/facade-lab.html` showing the facade lab viewer

### Requirement: Data source layer
The facade lab SHALL expose a pure data layer with `getFacadeLabData(seed)` returning building/wall listings and `getWallFacadeView(seed, buildingIndex, wallIndex)` returning a `FacadeLabView` with wall, floors, bay dimensions, placements, element catalog, and computed metrics.

#### Scenario: Data source returns valid structure
- **WHEN** `getWallFacadeView` is called with a valid seed, building index, and wall index
- **THEN** the returned `FacadeLabView` SHALL contain `wall`, `floors`, `bayWidth`, `edgeMargin`, `placements`, `elementCatalog`, `bayCount`, and `usableWidth`

#### Scenario: Data source is deterministic
- **WHEN** `getWallFacadeView` is called twice with the same arguments
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
