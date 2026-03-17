# workbench-rendering Specification

## Purpose
Browser workbench rendering of generated buildings using Three.js — renderers now consolidated under `src/viewers/stages/` with shared infrastructure in `src/viewers/shared/`.
## Requirements
### Requirement: Facade element rendering with InstancedMesh
The workbench SHALL render facade elements using `THREE.InstancedMesh`. For elements with `"box"` geometry, it SHALL create a single InstancedMesh using the element's box dimensions. For elements with `"composite"` geometry, it SHALL create one InstancedMesh per unique (elementId, role) combination, where each InstancedMesh renders the geometry parts matching that role. Each instance SHALL be positioned according to the placement's position and rotationY. When a placement has an optional `scale` field set, the instance transform SHALL apply that scale before computing the matrix.

#### Scenario: Composite elements render all parts
- **WHEN** the workbench renders a scene containing composite elements
- **THEN** each composite element placement SHALL produce visible geometry for every part in its definition

#### Scenario: Per-role materials on composite elements
- **WHEN** a composite element with parts having roles "pane", "shutter", and "sill" is rendered
- **THEN** each role's parts SHALL use a distinct material color looked up from the palette

#### Scenario: Box elements still render correctly
- **WHEN** the workbench renders elements with "box" geometry
- **THEN** they SHALL render as before using a single InstancedMesh per elementId

#### Scenario: Placement scale applied to instance transform
- **WHEN** a placement has `scale: { x: 1.2, y: 1.2, z: 1.2 }` set
- **THEN** the instance transform matrix SHALL include the scale, making the rendered element 1.2x larger in all dimensions

#### Scenario: Missing scale treated as identity
- **WHEN** a placement has no `scale` field
- **THEN** the instance transform SHALL use scale `(1, 1, 1)` (no scaling applied)

### Requirement: Per-building color variation
Each building mesh SHALL have a slightly different warm color, computed using a seeded hue shift (+/-15 degrees) from a base warm tone.

#### Scenario: Buildings have distinct colors
- **WHEN** the workbench renders multiple buildings
- **THEN** buildings SHALL have visually distinct but harmonious warm colors

### Requirement: Element materials distinguish from walls
Facade element meshes SHALL use material colors derived from the element catalog's `defaultPalette`, mapping each geometry part's `role` to its palette color. Parts SHALL be visually distinct from the building wall surface.

#### Scenario: Role colors come from palette
- **WHEN** facade elements are rendered
- **THEN** each geometry part's material color SHALL match the color mapped to its role in the catalog's defaultPalette

#### Scenario: Elements contrast with walls
- **WHEN** facade elements are rendered
- **THEN** element materials SHALL use colors visually distinct from the building wall material

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
