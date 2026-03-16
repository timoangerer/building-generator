## ADDED Requirements

### Requirement: Gallery Vite entry point
The system SHALL provide a `gallery.html` entry point, `vite.gallery.config.ts` Vite config, and `src/gallery/main.tsx` React entry point. The gallery SHALL be launchable via `npm run dev:gallery`.

#### Scenario: Gallery starts successfully
- **WHEN** `npm run dev:gallery` is executed
- **THEN** the gallery SHALL open in the browser with the gallery shell rendered

### Requirement: Gallery shell layout
The gallery SHALL render a layout with a sidebar listing all fixtures grouped by stage, a 3D/2D viewport area, a control bar, and an invariant results panel with JSON inspector. The sidebar SHALL be auto-populated from the `allFixtures` registry.

#### Scenario: Sidebar lists all fixture stages and seeds
- **WHEN** the gallery loads
- **THEN** the sidebar SHALL display collapsible groups for each stage in `allFixtures`, with each group listing the fixture's canonical seeds

#### Scenario: Selecting a fixture case renders it
- **WHEN** a user clicks a stage + seed combination in the sidebar
- **THEN** the gallery SHALL run `generator(configFactory(seed))` and render the result in the viewport using the appropriate stage renderer

### Requirement: Live invariant checking
The gallery SHALL run all invariant `check` functions from the selected fixture against the generated result and display pass/fail badges next to each invariant name.

#### Scenario: Invariant badges show pass/fail
- **WHEN** a fixture case is selected and rendered
- **THEN** the gallery SHALL display each invariant from the fixture with a pass (green) or fail (red) badge based on `check(result)`

#### Scenario: All-pass summary
- **WHEN** all invariants pass for a selected case
- **THEN** the gallery SHALL show a summary like "5/5 passed"

### Requirement: Per-stage renderers
The system SHALL provide a `StageRenderer<T>` interface with `mount(container, result, options)`, `update(result, options)`, and `dispose()` methods. The system SHALL include renderers for: scene (full 3D scene), plot (top-down 2D), massing (3D box volumes), element (single element color-coded by role), and facade (facade wall with placements).

#### Scenario: Scene renderer renders full building scene
- **WHEN** the scene renderer is mounted with a pipeline result
- **THEN** it SHALL render a full Three.js scene with OrbitControls

#### Scenario: Renderers respond to options changes
- **WHEN** `update` is called with changed `RenderOptions` (wireframe, colorMode, showBounds)
- **THEN** the renderer SHALL update the visualization accordingly

#### Scenario: Renderer cleanup
- **WHEN** `dispose` is called on a renderer
- **THEN** it SHALL release all Three.js resources and remove event listeners

### Requirement: Gallery controls
The gallery SHALL provide controls for: wireframe toggle, color mode selector (role / element-type / building / flat), bounds overlay toggle, JSON inspector toggle, and seed stepper (increment/decrement within the fixture's seed list).

#### Scenario: Wireframe toggle affects rendering
- **WHEN** the wireframe toggle is enabled
- **THEN** the active renderer SHALL display all geometry in wireframe mode

#### Scenario: Seed stepper navigates seeds
- **WHEN** the user clicks the seed increment button
- **THEN** the gallery SHALL advance to the next seed in the fixture's seed list and re-render

### Requirement: Agent data exposure
The gallery SHALL expose structured state via `window.__galleryState` containing the current stage, seed, config, generated result, and invariant results (each with name and passed boolean).

#### Scenario: Gallery state is readable from console
- **WHEN** a fixture case is selected in the gallery
- **THEN** `window.__galleryState` SHALL return an object with `stage`, `seed`, `config`, `result`, and `invariants` fields

#### Scenario: Invariant results match badge display
- **WHEN** `window.__galleryState.invariants` is read
- **THEN** each entry SHALL have `name` and `passed` fields matching the displayed badges

### Requirement: JSON inspector
The gallery SHALL include a collapsible JSON inspector panel that displays the full typed result object for the active fixture case.

#### Scenario: JSON inspector shows result data
- **WHEN** a fixture case is selected and the JSON inspector is open
- **THEN** it SHALL display the complete generated result as formatted JSON
