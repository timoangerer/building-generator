# workbench-shell Specification

## Purpose
React shell for the unified workbench, hosting both pipeline stage fixtures and environment tool viewers in a single ShadCN/ui application with Leva controls.

## Requirements

### Requirement: React app with unified viewer host
The workbench SHALL be a React application that hosts both fixture-based pipeline stage viewers and tool-based viewers (e.g., environment). It SHALL use a ShadCN/ui `Sidebar` for navigation with fixture stages and tool sections listed as `SidebarGroup` entries. The workbench SHALL use dark mode via `class="dark"` on the HTML root.

#### Scenario: Workbench renders on load
- **WHEN** the workbench is opened in a browser via `npm run dev`
- **THEN** the ShadCN sidebar SHALL be visible with all fixture stages and tool sections listed

#### Scenario: Selecting a fixture renders the stage
- **WHEN** a user clicks a stage + seed combination in the sidebar
- **THEN** the workbench SHALL run `generator(configFactory(seed))` and render the result in the viewport using the appropriate `StageRenderer`

#### Scenario: Selecting a tool section renders the tool
- **WHEN** a user clicks a tool section item (e.g., an environment preset) in the sidebar
- **THEN** the workbench SHALL mount the appropriate `ToolRenderer` and render the tool's controls

### Requirement: WorkbenchSection discriminated union
The workbench SHALL model sidebar sections as a discriminated union of `FixtureSection` (kind: "fixture", with stage and fixture data) and `ToolSection` (kind: "tool", with id, label, and items array). Selection state SHALL track `kind`, `sectionIndex`, and `itemIndex`.

#### Scenario: Fixture and tool sections coexist
- **WHEN** the workbench loads
- **THEN** the sidebar SHALL list all fixture sections (from `allFixtures`) followed by all tool sections

### Requirement: Environment tool integration
The workbench SHALL include an environment tool section populated from the env-lab preset list. When an environment preset is selected, the workbench SHALL mount the env renderer as a `ToolRenderer` and render `EnvLabControls` overlaid on the viewport.

#### Scenario: Environment presets appear in sidebar
- **WHEN** the workbench loads
- **THEN** the sidebar SHALL display an "environment" group listing all env-lab preset names

#### Scenario: Switching between fixture and tool preserves state
- **WHEN** a user switches from a fixture selection to a tool selection and back
- **THEN** the previous renderer SHALL be properly disposed and the new renderer SHALL mount without errors

### Requirement: Live invariant checking
The workbench SHALL run all invariant `check` functions from the selected fixture against the generated result and display pass/fail badges next to each invariant name.

#### Scenario: Invariant badges show pass/fail
- **WHEN** a fixture case is selected and rendered
- **THEN** the workbench SHALL display each invariant from the fixture with a pass (green) or fail (red) badge based on `check(result)`

#### Scenario: All-pass summary
- **WHEN** all invariants pass for a selected case
- **THEN** the workbench SHALL show a summary like "5/5 passed"

### Requirement: Fixture label display
The workbench SHALL display descriptive fixture labels when available. When a fixture provides `labels[i]` for the current seed index, the top bar SHALL show `stage / label`. When no label is available, it SHALL fall back to `seed X`.

#### Scenario: Fixture with labels shows descriptive name
- **WHEN** a fixture case is selected and the fixture has a `labels` array with an entry for the current seed index
- **THEN** the top bar SHALL display the label text (e.g., "facade / narrow 3-floor (8m)")

#### Scenario: Fixture without labels shows seed number
- **WHEN** a fixture case is selected and the fixture has no `labels` array
- **THEN** the top bar SHALL display "seed N" where N is the current seed value

### Requirement: Invariant results in dialog
The workbench SHALL display invariant check results in a `Dialog` modal accessible via a button, rather than a permanently visible panel. The dialog SHALL show pass/fail badges for each invariant and a summary count.

#### Scenario: Invariant dialog shows results
- **WHEN** the invariant dialog is opened for a selected fixture case
- **THEN** it SHALL display each invariant from the fixture with a pass (green) or fail (red) badge based on `check(result)` and a summary like "5/5 passed"

### Requirement: Leva controls positioning
The workbench SHALL render Leva parameter controls as a floating panel at the top-right of the viewport area, not in a separate panel.

#### Scenario: Leva controls overlay viewport
- **WHEN** a fixture case is selected with a renderer that exposes Leva controls
- **THEN** the Leva panel SHALL appear floating at the top-right of the viewport

### Requirement: Workbench controls
The workbench SHALL provide controls for: wireframe toggle, color mode selector (role / element-type / building / flat), bounds overlay toggle, JSON inspector toggle, and seed stepper (increment/decrement within the fixture's seed list).

#### Scenario: Wireframe toggle affects rendering
- **WHEN** the wireframe toggle is enabled
- **THEN** the active renderer SHALL display all geometry in wireframe mode

#### Scenario: Seed stepper navigates seeds
- **WHEN** the user clicks the seed increment button
- **THEN** the workbench SHALL advance to the next seed in the fixture's seed list and re-render

### Requirement: Agent data exposure
The workbench SHALL expose structured state via `window.__workbenchState` containing the current stage, seed, config, generated result, and invariant results (each with name and passed boolean).

#### Scenario: Workbench state is readable from console
- **WHEN** a fixture case is selected in the workbench
- **THEN** `window.__workbenchState` SHALL return an object with `stage`, `seed`, `config`, `result`, and `invariants` fields

#### Scenario: Invariant results match badge display
- **WHEN** `window.__workbenchState.invariants` is read
- **THEN** each entry SHALL have `name` and `passed` fields matching the displayed badges

### Requirement: JSON inspector
The workbench SHALL include a collapsible JSON inspector panel that displays the full typed result object for the active fixture case.

#### Scenario: JSON inspector shows result data
- **WHEN** a fixture case is selected and the JSON inspector is open
- **THEN** it SHALL display the complete generated result as formatted JSON

### Requirement: Single Vite entry point
The workbench SHALL be the sole Vite entry point at `src/workbench/index.html`. All lab and gallery entry points SHALL be removed. The `npm run dev` command SHALL serve the workbench.

#### Scenario: Dev server serves workbench
- **WHEN** `npm run dev` is executed
- **THEN** the workbench SHALL be accessible at `/src/workbench/index.html`
