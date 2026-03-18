## MODIFIED Requirements

### Requirement: Environment tool integration
The workbench SHALL include an environment tool section populated from the env-lab preset list. When an environment preset is selected in the sidebar, the workbench SHALL apply that preset to the env scene immediately. If the env renderer is already mounted (from a previous environment preset selection), the workbench SHALL reuse the existing renderer and only apply the new preset — it SHALL NOT dispose and remount the renderer. The selected preset name SHALL be passed to `EnvLabControls` via a `presetName` prop.

#### Scenario: Environment presets appear in sidebar
- **WHEN** the workbench loads
- **THEN** the sidebar SHALL display an "environment" group listing all env-lab preset names

#### Scenario: Clicking a preset applies it immediately
- **WHEN** a user clicks an environment preset (e.g., "Midday") in the sidebar
- **THEN** the env scene SHALL load that preset's layer selections, parameter overrides, and fog configuration

#### Scenario: Switching presets reuses the renderer
- **WHEN** a user switches from one environment preset to another in the sidebar
- **THEN** the existing env renderer SHALL be reused (no WebGL context teardown)
- **AND** the new preset SHALL be applied via the existing `EnvSceneApi`

#### Scenario: Switching from fixture to environment preset
- **WHEN** a user switches from a fixture selection to an environment preset
- **THEN** the fixture renderer SHALL be disposed and the env renderer SHALL mount and apply the selected preset

#### Scenario: Switching between fixture and tool preserves state
- **WHEN** a user switches from a fixture selection to a tool selection and back
- **THEN** the previous renderer SHALL be properly disposed and the new renderer SHALL mount without errors

## ADDED Requirements

### Requirement: Environment preset name in selection state
The workbench selection state for tool items SHALL include the preset name so that `EnvLabControls` can receive it as a prop. When the selection changes to a different environment preset, `EnvLabControls` SHALL receive the updated preset name and reset all Leva controls to match the new preset's defaults.

#### Scenario: Preset name flows to EnvLabControls
- **WHEN** a user clicks "Dramatic" in the sidebar
- **THEN** `EnvLabControls` SHALL receive `presetName="Dramatic"` and all Leva layer/param/fog controls SHALL reset to the Dramatic preset's values
