# gallery-viewer Specification

## Purpose
Multi-stage visual test gallery that renders each pipeline stage (plot, massing, element, facade, building, pipeline) side-by-side with configurable seeds and rendering options.
## MODIFIED Requirements
### Requirement: Gallery shell layout
The gallery SHALL render a ShadCN/ui-based layout with a collapsible `Sidebar` listing all fixtures grouped by stage, a viewport area filling remaining space, floating Leva controls at top-right, and a `Dialog` modal for invariant results. The gallery SHALL use dark mode via `class="dark"` on the HTML root. The sidebar SHALL be auto-populated from the `allFixtures` registry.

#### Scenario: Sidebar lists all fixture stages and seeds
- **WHEN** the gallery loads
- **THEN** the sidebar SHALL display collapsible `SidebarGroup` sections for each stage in `allFixtures`, with each group listing the fixture's canonical seeds as `SidebarMenuButton` items

#### Scenario: Selecting a fixture case renders it
- **WHEN** a user clicks a stage + seed combination in the sidebar
- **THEN** the gallery SHALL run `generator(configFactory(seed))` and render the result in the viewport using the appropriate stage renderer

#### Scenario: Dark mode is active
- **WHEN** the gallery loads
- **THEN** the HTML root SHALL have `class="dark"` and the gallery SHALL render with dark theme styling

### Requirement: Fixture label display
The gallery SHALL display descriptive fixture labels when available. When a fixture provides `labels[i]` for the current seed index, the top bar SHALL show `stage / label`. When no label is available, it SHALL fall back to `seed X`.

#### Scenario: Fixture with labels shows descriptive name
- **WHEN** a fixture case is selected and the fixture has a `labels` array with an entry for the current seed index
- **THEN** the top bar SHALL display the label text (e.g., "facade / narrow 3-floor (8m)")

#### Scenario: Fixture without labels shows seed number
- **WHEN** a fixture case is selected and the fixture has no `labels` array
- **THEN** the top bar SHALL display "seed N" where N is the current seed value

### Requirement: Invariant results in dialog
The gallery SHALL display invariant check results in a `Dialog` modal accessible via a button, rather than a permanently visible panel. The dialog SHALL show pass/fail badges for each invariant and a summary count.

#### Scenario: Invariant dialog shows results
- **WHEN** the invariant dialog is opened for a selected fixture case
- **THEN** it SHALL display each invariant from the fixture with a pass (green) or fail (red) badge based on `check(result)` and a summary like "5/5 passed"

### Requirement: Leva controls positioning
The gallery SHALL render Leva parameter controls as a floating panel at the top-right of the viewport area, not in a separate panel.

#### Scenario: Leva controls overlay viewport
- **WHEN** a fixture case is selected with a renderer that exposes Leva controls
- **THEN** the Leva panel SHALL appear floating at the top-right of the viewport

## MODIFIED Requirements
### Requirement: Per-stage renderers
The system SHALL provide a `StageRenderer<T>` interface with `mount(container, result, options)`, `update(result, options)`, and `dispose()` methods. The system SHALL include renderers for: pipeline (full 3D scene), plot (top-down 2D), massing (3D box volumes), element (single element color-coded by role), facade (2D canvas via facade-lab), and building (3D colored boxes with floor lines).

#### Scenario: Facade renderer uses 2D canvas
- **WHEN** the facade renderer is mounted with a `FacadeResult`
- **THEN** it SHALL convert the result to a `FacadeLabView` (extracting first non-party wall, computing element bounds, building element catalog) and render it using `renderFacade2D` on a Canvas 2D surface

#### Scenario: Building renderer shows 3D boxes
- **WHEN** the building renderer is mounted with a `BuildingResult`
- **THEN** it SHALL render buildings as colored boxes with floor lines, wall outlines, a ground plane, and auto-positioned camera using Three.js with OrbitControls

#### Scenario: Renderer cleanup
- **WHEN** `dispose` is called on a renderer
- **THEN** it SHALL release all resources (Three.js objects, canvas elements, ResizeObservers) and remove event listeners

## Unchanged Requirements
### Requirement: Gallery Vite entry point
The system SHALL provide a `gallery.html` entry point, `vite.gallery.config.ts` Vite config, and `src/gallery/main.tsx` React entry point. The gallery SHALL be launchable via `npm run dev:gallery`.

### Requirement: Live invariant checking
The gallery SHALL run all invariant `check` functions from the selected fixture against the generated result and display pass/fail badges next to each invariant name.

### Requirement: Gallery controls
The gallery SHALL provide controls for: wireframe toggle, color mode selector, bounds overlay toggle, JSON inspector toggle, and seed stepper.

### Requirement: Agent data exposure
The gallery SHALL expose structured state via `window.__galleryState` containing the current stage, seed, config, generated result, and invariant results.

### Requirement: JSON inspector
The gallery SHALL include a collapsible JSON inspector panel that displays the full typed result object for the active fixture case.
