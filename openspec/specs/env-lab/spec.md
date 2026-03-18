# env-lab Specification

## Purpose
Interactive 3D environment system for experimenting with atmosphere, lighting, sky, and terrain rendering — now a reusable module under `src/viewers/environment/` embedded in the unified workbench.
## Requirements
### Requirement: Layer system with three categories
The env-lab SHALL support three layer categories: **water**, **sky**, and **terrain**. Each category SHALL have multiple swappable approaches that implement a common `EnvLayer` interface. Layers SHALL be independently swappable at runtime without page reload. Each approach SHALL expose typed `ParamDescriptor` entries for live tweaking.

#### Scenario: Swap a layer at runtime
- **WHEN** the user selects a different approach for a layer category
- **THEN** the old layer SHALL be disposed and the new layer SHALL be created without reloading the page

### Requirement: EnvLayer interface contract
All layer approaches SHALL implement the `EnvLayer` interface: `create(scene, camera)` to add Three.js objects, `update(dt, elapsed)` called every frame, `setParam(key, value)` for immediate parameter updates, `getParams()` returning `ParamDescriptor[]` for auto-generated UI, and `dispose()` to remove objects and release GPU resources.

#### Scenario: Layer exposes parameters
- **WHEN** a layer is created
- **THEN** `getParams()` SHALL return an array of `ParamDescriptor` objects describing all tweakable parameters

### Requirement: Water approaches
The env-lab SHALL provide three water approaches: **flat-sine** (PlaneGeometry with sine wave vertex displacement), **stylized-shader** (custom ShaderMaterial with Gerstner waves, depth-based coloring, and foam), and **threejs-ocean** (Three.js Water with reflection/refraction and animated normal maps).

#### Scenario: Each water approach renders
- **WHEN** any water approach is selected
- **THEN** it SHALL render an animated water surface in the scene

### Requirement: Sky approaches
The env-lab SHALL provide three sky approaches: **gradient** (vertical linear gradient from zenith to horizon), **hemisphere-dome** (inverted sphere with vertex color gradient and optional horizon glow), and **atmospheric** (Three.js Sky with Preetham atmospheric scattering).

#### Scenario: Each sky approach renders
- **WHEN** any sky approach is selected
- **THEN** it SHALL render a sky background in the scene

### Requirement: Terrain approaches with flat center plateau
The env-lab SHALL provide three terrain approaches: **plateau-noise** (circular base with noise-modulated coastline and radial falloff), **layered-strata** (flat top disc with concentric step-downs), and **smooth-slope** (smooth noise-modulated slope with height-based color zones). All terrains MUST have a flat center plateau of at least 60x60 units. All terrains SHALL expose `getHeightAt(x, z)` returning the plateau height for coordinates within the flat center region.

#### Scenario: Terrain has flat center
- **WHEN** a terrain is created
- **THEN** `getHeightAt` SHALL return the plateau height for coordinates within the flat center region

### Requirement: Fog as preset property
Fog SHALL be a property of presets, not a standalone layer. The fog config SHALL include `enabled`, `type` (linear or exponential), `color`, and type-specific range parameters. Fog SHALL be applied to `scene.fog` when a preset loads or fog parameters change.

#### Scenario: Fog applied from preset
- **WHEN** a preset with fog enabled is selected
- **THEN** `scene.fog` SHALL be set according to the preset's fog configuration

### Requirement: Module location
The env-lab scene, layer system, presets, registry, and all layer implementations SHALL reside under `src/viewers/environment/`. A barrel export at `src/viewers/environment/index.ts` SHALL expose `createEnvScene`, `EnvSceneApi`, `presets`, `getLayerIds`, and all relevant types.

#### Scenario: Env module importable from viewers
- **WHEN** a module imports from `@/viewers`
- **THEN** it SHALL be able to access `createEnvScene`, `presets`, and `EnvSceneApi`

### Requirement: ToolRenderer-based env renderer
The env-lab SHALL provide an `EnvRendererHandle` that extends `ToolRenderer` with a `getApi()` method returning the `EnvSceneApi`. The renderer SHALL be registered in the tool renderer factory under the id `"environment"`.

#### Scenario: Env renderer mounts and exposes API
- **WHEN** the env renderer is mounted
- **THEN** `getApi()` SHALL return a non-null `EnvSceneApi` instance

#### Scenario: Env renderer loads first preset on mount
- **WHEN** the env renderer is mounted
- **THEN** it SHALL automatically load the first preset's layer selections and fog configuration

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

### Requirement: Standalone entry point removed
The standalone `src/env-lab/index.html` entry point and `dev:env-lab` npm script SHALL be removed. The environment viewer is accessible only through the workbench's tool section.

#### Scenario: No env-lab entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `env-lab` entry in Vite's rollup inputs

### Requirement: Layer registry
The env-lab SHALL use a central registry that maps string IDs to factory functions. The control panel SHALL read available approaches from the registry. Adding a new approach SHALL require only implementing the file and registering it in the registry.

#### Scenario: Registry provides layer options
- **WHEN** the control panel renders
- **THEN** layer dropdowns SHALL list all approaches registered in the registry

### Requirement: No resource leaks on layer switch
Switching any layer at runtime MUST NOT leak Three.js objects. `dispose()` SHALL be called on the old layer before `create()` on the new one. All layers MUST be independently instantiable with no hidden dependencies between water, sky, and terrain.

#### Scenario: Dispose called before new layer
- **WHEN** the user switches a layer approach
- **THEN** the previous layer's `dispose()` SHALL be called before the new layer's `create()`
