# env-lab Specification

## Purpose
Interactive 3D environment lab for experimenting with atmosphere, lighting, sky, and terrain rendering around generated buildings.
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

### Requirement: Named presets
The env-lab SHALL provide named presets (Minimal, Diorama, Tropical, Dramatic) that set all layer selections, fog configuration, and parameter overrides. Selecting a preset SHALL populate all controls. Manually changing any control SHALL switch the preset display to "Custom".

#### Scenario: Preset populates controls
- **WHEN** the user selects a named preset
- **THEN** all layer dropdowns, parameter controls, and fog settings SHALL update to match the preset

#### Scenario: Manual change shows Custom
- **WHEN** the user manually changes any control after selecting a preset
- **THEN** the preset display SHALL show "Custom"

### Requirement: Standalone viewer entry point
The env-lab SHALL be a separate Vite entry point with `dev:env-lab` script, rendering a Three.js scene with PerspectiveCamera, OrbitControls, and warm directional + hemisphere lighting. A React overlay control panel SHALL provide preset dropdown, layer approach dropdowns (auto-populated from registry), per-approach parameter controls, and fog controls.

#### Scenario: Dev server launches env-lab
- **WHEN** the user runs `npm run dev:env-lab`
- **THEN** the browser SHALL open to `env-lab.html` showing the environment lab viewer

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

