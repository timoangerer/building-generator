# workbench-rendering Delta Spec

## MODIFIED Requirements

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
