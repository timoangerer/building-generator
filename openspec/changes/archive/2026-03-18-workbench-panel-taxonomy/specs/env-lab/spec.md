## MODIFIED Requirements

### Requirement: Extracted Leva controls component
The env-lab SHALL provide an `EnvLabControls` React component that accepts an `EnvSceneApi` prop and a `presetName` string prop. It SHALL render Leva controls for per-category layer selection, per-layer parameter tweaking, and fog configuration. It SHALL NOT render a Preset selection dropdown — preset selection is the responsibility of the workbench sidebar. When `presetName` changes, the component SHALL apply the corresponding preset (layer selections, parameter overrides, fog) to the scene via the API and reset all Leva controls to match. This component SHALL be importable from `@/viewers`.

#### Scenario: Controls render when API is available
- **WHEN** `EnvLabControls` is rendered with a non-null API and a valid preset name
- **THEN** Leva panels for Terrain, Sky, Water, and Fog SHALL appear (but NOT a Preset panel)

#### Scenario: Controls handle null API gracefully
- **WHEN** `EnvLabControls` is rendered with a null API
- **THEN** it SHALL render without errors and wait for API availability

#### Scenario: Preset name change applies preset
- **WHEN** `presetName` prop changes from "Midday" to "Dramatic"
- **THEN** the component SHALL call `api.setLayer()` for each category with the Dramatic preset's layer selections
- **AND** apply any parameter overrides from the Dramatic preset
- **AND** apply the Dramatic preset's fog configuration
- **AND** reset all Leva control values to match the new preset's defaults

#### Scenario: Manual tweak after preset is ephemeral
- **WHEN** a user manually changes a layer parameter in Leva after a preset is applied
- **THEN** the change SHALL take effect immediately via `api.setLayerParam()`
- **AND** the change SHALL be reset when a new preset is applied via `presetName` prop change

## REMOVED Requirements

### Requirement: Named presets
**Reason**: Preset selection moves from the Leva panel to the workbench sidebar. The preset data (`presets.ts`) remains unchanged, but the Leva "Preset" dropdown and the "Custom" display logic are removed. Preset application is now driven by the `presetName` prop on `EnvLabControls`.
**Migration**: Sidebar clicks now drive preset selection. The `presetName` prop on `EnvLabControls` replaces the Leva preset dropdown.
