## ADDED Requirements

### Requirement: Facade element rendering with InstancedMesh
The workbench SHALL render facade elements using `THREE.InstancedMesh`, grouped by `elementId`. Each instance SHALL use the element's box geometry dimensions from the catalog and be positioned according to the placement's position and rotationY.

#### Scenario: Elements visible on exposed walls
- **WHEN** the workbench renders a scene with facade placements
- **THEN** InstancedMesh objects SHALL be created for each unique elementId with instance count matching the number of placements for that element

#### Scenario: Element geometry matches catalog
- **WHEN** an InstancedMesh is created for elementId "window-small"
- **THEN** the BoxGeometry dimensions SHALL match the catalog entry's width, height, and depth

### Requirement: Per-building color variation
Each building mesh SHALL have a slightly different warm color, computed using a seeded hue shift (±15°) from a base warm tone.

#### Scenario: Buildings have distinct colors
- **WHEN** the workbench renders multiple buildings
- **THEN** buildings SHALL have visually distinct but harmonious warm colors

### Requirement: Element materials distinguish from walls
Facade element meshes SHALL use a material color distinct from the building wall color to visually distinguish windows and doors from the wall surface.

#### Scenario: Elements contrast with walls
- **WHEN** facade elements are rendered
- **THEN** element materials SHALL use a darker or contrasting color compared to the building wall material
