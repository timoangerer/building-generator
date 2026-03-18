# workbench-rendering Specification

## Purpose
Browser workbench rendering of generated buildings using Three.js — renderers now consolidated under `src/viewers/stages/` with shared infrastructure in `src/viewers/shared/`.

## MODIFIED Requirements

### Requirement: Renderer module location
All stage renderers SHALL reside under `src/viewers/stages/`. Shared Three.js infrastructure (context setup, geometry utilities) SHALL reside under `src/viewers/shared/`. The old `src/rendering/index.ts` and `src/gallery/renderers/` directories SHALL be removed.

#### Scenario: Renderers import shared utilities from viewers
- **WHEN** a stage renderer needs Three.js setup
- **THEN** it SHALL import from `../shared/three-setup` (within the viewers module)

#### Scenario: Old rendering module removed
- **WHEN** the project is built
- **THEN** there SHALL be no `src/rendering/index.ts` file

### Requirement: Lint rules updated
The `no-three-outside-rendering` lint rule SHALL allow Three.js imports in `src/viewers/` only (replacing the previous list of `workbench`, `gallery`, `env-lab`, `facade-lab`, `plot-lab`, `rendering`). The `no-internal-module-imports` rule SHALL list `viewers` as a module root (replacing `gallery`, `env-lab`, `facade-lab`, `plot-lab`, `rendering`).

#### Scenario: Viewers directory allowed for Three.js
- **WHEN** a file under `src/viewers/` imports from `three`
- **THEN** the lint rule SHALL not report a violation

#### Scenario: Workbench directory no longer needs Three.js allowance
- **WHEN** a file under `src/workbench/` imports from `three`
- **THEN** the lint rule SHALL report a violation (workbench delegates to viewers)
