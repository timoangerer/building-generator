# env-lab Specification

## Purpose
Interactive 3D environment system for experimenting with atmosphere, lighting, sky, and terrain rendering — now a reusable module under `src/viewers/environment/` embedded in the unified workbench.

## MODIFIED Requirements

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
The env-lab SHALL provide an `EnvLabControls` React component that accepts an `EnvSceneApi` prop and renders Leva controls for preset selection, per-category layer selection, per-layer parameter tweaking, and fog configuration. This component SHALL be importable from `@/viewers`.

#### Scenario: Controls render when API is available
- **WHEN** `EnvLabControls` is rendered with a non-null API
- **THEN** Leva panels for Preset, Terrain, Sky, Water, and Fog SHALL appear

#### Scenario: Controls handle null API gracefully
- **WHEN** `EnvLabControls` is rendered with a null API
- **THEN** it SHALL render without errors and wait for API availability

### Requirement: Standalone entry point removed
The standalone `src/env-lab/index.html` entry point and `dev:env-lab` npm script SHALL be removed. The environment viewer is accessible only through the workbench's tool section.

#### Scenario: No env-lab entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `env-lab` entry in Vite's rollup inputs
