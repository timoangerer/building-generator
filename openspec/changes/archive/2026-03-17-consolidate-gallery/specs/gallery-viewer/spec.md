# gallery-viewer Specification

## Purpose
Pipeline stage viewer infrastructure providing per-stage renderers, display controls, invariant checking, and fixture navigation — now consolidated under `src/viewers/` and hosted within the unified workbench.

## MODIFIED Requirements

### Requirement: Viewers module structure
The system SHALL organize all rendering code under `src/viewers/` with three sub-modules: `shared/` (Three.js setup, geometry utilities, `StageRenderer`/`ToolRenderer`/`RenderOptions` types), `stages/` (per-stage renderers and registry factory), and `environment/` (env scene, layers, presets, controls). A barrel export at `src/viewers/index.ts` SHALL re-export all public APIs.

#### Scenario: Renderers importable from barrel
- **WHEN** a module imports `getRenderer` from `@/viewers`
- **THEN** it SHALL receive the stage renderer factory function

#### Scenario: Types importable from barrel
- **WHEN** a module imports `StageRenderer`, `ToolRenderer`, or `RenderOptions` from `@/viewers`
- **THEN** it SHALL receive the correct type definitions

### Requirement: ToolRenderer interface
The system SHALL define a `ToolRenderer` interface with `mount(container: HTMLElement): Promise<void>` and `dispose(): void` methods. Tool renderers manage their own data and lifecycle, unlike `StageRenderer<T>` which receives typed results.

#### Scenario: ToolRenderer mounts asynchronously
- **WHEN** a `ToolRenderer.mount` is called
- **THEN** it SHALL return a Promise that resolves when the renderer is ready

#### Scenario: ToolRenderer disposes cleanly
- **WHEN** `dispose` is called on a tool renderer
- **THEN** it SHALL release all resources without errors

### Requirement: Renderer factory with tool support
The system SHALL provide `getRenderer(stage)` for stage renderers and `getToolRenderer(id)` for tool renderers. Both SHALL return `null` for unknown identifiers.

#### Scenario: getToolRenderer returns env renderer
- **WHEN** `getToolRenderer("environment")` is called
- **THEN** it SHALL return a `ToolRenderer` that mounts the env scene

### Requirement: Per-stage renderers
The system SHALL include renderers for: pipeline (full 3D scene), plot (top-down 2D), massing (3D box volumes), element (single element color-coded by role), facade (2D canvas via facade-canvas), and building (3D colored boxes with floor lines). All renderers SHALL live under `src/viewers/stages/`.

#### Scenario: All stage renderers are registered
- **WHEN** the renderer factory is initialized
- **THEN** it SHALL have entries for pipeline, plot, massing, element, facade, and building stages

### Requirement: Shared Three.js infrastructure
The system SHALL provide shared Three.js utilities in `src/viewers/shared/`: `createThreeContext` for scene/camera/renderer setup, `clearMeshes`/`disposeContext` for cleanup, `buildPartGeometry` for element geometry, and `buildingBaseColor` for per-building color variation.

#### Scenario: Shared utilities importable
- **WHEN** a stage renderer imports from `@/viewers/shared`
- **THEN** it SHALL receive Three.js setup and geometry utility functions

### Requirement: Gallery entry point removed
The standalone gallery entry point (`src/gallery/index.html`, `src/gallery/main.tsx`) SHALL be removed. Gallery functionality is now provided by the workbench.

#### Scenario: No gallery entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `gallery` entry in Vite's rollup inputs
