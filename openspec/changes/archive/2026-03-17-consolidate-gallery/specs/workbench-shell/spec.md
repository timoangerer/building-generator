# workbench-shell Specification

## Purpose
React shell for the unified workbench, hosting both pipeline stage fixtures and environment tool viewers in a single ShadCN/ui application with Leva controls.

## MODIFIED Requirements

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

### Requirement: Agent data exposure
The workbench SHALL expose structured state via `window.__workbenchState` containing the current stage, seed, config, generated result, and invariant results (each with name and passed boolean).

#### Scenario: Workbench state is readable from console
- **WHEN** a fixture case is selected in the workbench
- **THEN** `window.__workbenchState` SHALL return an object with `stage`, `seed`, `config`, `result`, and `invariants` fields

### Requirement: Single Vite entry point
The workbench SHALL be the sole Vite entry point at `src/workbench/index.html`. All lab and gallery entry points SHALL be removed. The `npm run dev` command SHALL serve the workbench.

#### Scenario: Dev server serves workbench
- **WHEN** `npm run dev` is executed
- **THEN** the workbench SHALL be accessible at `/src/workbench/index.html`
