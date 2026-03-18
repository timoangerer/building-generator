# facade-lab Specification

## Purpose
2D facade rendering and data source utilities for visualizing facade decomposition — now located under `src/viewers/stages/` with standalone entry point removed.

## MODIFIED Requirements

### Requirement: Module location
The facade canvas renderer SHALL reside at `src/viewers/stages/facade-canvas.ts`. The facade data source SHALL reside at `src/viewers/stages/facade-data.ts` with its test at `src/viewers/stages/facade-data.test.ts`.

#### Scenario: Facade canvas importable from viewers
- **WHEN** a module imports the facade canvas rendering function
- **THEN** it SHALL import from `src/viewers/stages/facade-canvas.ts`

### Requirement: Standalone entry point removed
The standalone `src/facade-lab/index.html` entry point, `src/facade-lab/index.ts` barrel export, `src/facade-lab/viewer/main.tsx`, and `dev:facade-lab` npm script SHALL be removed. Facade visualization is accessible only through the workbench's facade stage renderer.

#### Scenario: No facade-lab entry point
- **WHEN** the project is built
- **THEN** there SHALL be no `facade-lab` entry in Vite's rollup inputs

### Requirement: Data source layer preserved
The `getFacadeLabData(seed)` and `getWallFacadeView(seed, buildingIndex, wallIndex)` functions SHALL continue to work identically from their new location at `src/viewers/stages/facade-data.ts`.

#### Scenario: Data source is deterministic at new location
- **WHEN** `getWallFacadeView` is called twice with the same arguments from the new module path
- **THEN** both results SHALL be deeply equal
