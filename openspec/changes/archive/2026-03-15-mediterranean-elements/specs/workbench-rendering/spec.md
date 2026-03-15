## MODIFIED Requirements

### Requirement: Facade element rendering with InstancedMesh
The workbench SHALL render facade elements using `THREE.InstancedMesh`. For elements with `"box"` geometry, it SHALL create a single InstancedMesh using the element's box dimensions. For elements with `"composite"` geometry, it SHALL create one InstancedMesh per unique (elementId, role) combination, where each InstancedMesh renders the geometry parts matching that role. Each instance SHALL be positioned according to the placement's position and rotationY.

#### Scenario: Composite elements render all parts
- **WHEN** the workbench renders a scene containing composite elements
- **THEN** each composite element placement SHALL produce visible geometry for every part in its definition

#### Scenario: Per-role materials on composite elements
- **WHEN** a composite element with parts having roles "pane", "shutter", and "sill" is rendered
- **THEN** each role's parts SHALL use a distinct material color looked up from the palette

#### Scenario: Box elements still render correctly
- **WHEN** the workbench renders elements with "box" geometry
- **THEN** they SHALL render as before using a single InstancedMesh per elementId

### Requirement: Element materials distinguish from walls
Facade element meshes SHALL use material colors derived from the element catalog's `defaultPalette`, mapping each geometry part's `role` to its palette color. Parts SHALL be visually distinct from the building wall surface.

#### Scenario: Role colors come from palette
- **WHEN** facade elements are rendered
- **THEN** each geometry part's material color SHALL match the color mapped to its role in the catalog's defaultPalette

#### Scenario: Elements contrast with walls
- **WHEN** facade elements are rendered
- **THEN** element materials SHALL use colors visually distinct from the building wall material
