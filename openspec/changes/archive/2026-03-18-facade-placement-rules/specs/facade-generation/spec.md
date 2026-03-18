## MODIFIED Requirements

### Requirement: Element placement at bay centers
Each placement's horizontal position SHALL be at the center of its bay. Vertical position SHALL be determined by the tile-placement model: the facade generator SHALL call `resolveTilePlacement` with the tile rect (bayWidth × floorHeight), element bounds (including offsetX/offsetY), and the applicable placement rule (element-type default or grammar override). The resolved local position SHALL then be transformed to world space using the wall's start point, direction, and normal.

#### Scenario: Door Y position near floor base
- **WHEN** a door element is placed on a floor with baseY = 0 using default placement rule (anchor: bottom-center, origin: bottom-center)
- **THEN** the placement's `position.y` SHALL place the door's visual bottom edge at the floor base (within 0.02m tolerance)

#### Scenario: Window Y position at sill height
- **WHEN** a window element is placed on a floor with baseY = 0 using default placement rule (anchor: bottom-center, origin: bottom-center, offset.y: 0.9)
- **THEN** the placement's `position.y` SHALL place the window's visual bottom edge at 0.9m above floor base (within 0.02m tolerance)

#### Scenario: Balcony door with offset bounds
- **WHEN** a balcony-door element with non-zero bounds.offsetY is placed using default door placement rule
- **THEN** the visual bottom of the element's bounding box SHALL align to the floor base, not the geometry origin

### Requirement: Bay grid inspection artifact
The facade generator SHALL populate `WallFacade.bayGrid` with the element assignment for each floor/bay cell on exposed walls.

#### Scenario: Bay grid covers all floor/bay cells
- **WHEN** an exposed wall has 3 bays and 3 floors
- **THEN** `bayGrid` SHALL contain exactly 9 entries covering all (floorIndex, bayIndex) combinations

#### Scenario: Bay grid element IDs match placements
- **WHEN** `bayGrid` is populated
- **THEN** each `bayGrid` entry's `elementId` SHALL match the corresponding placement's `elementId`

## ADDED Requirements

### Requirement: WallFacade includes placement warnings
`WallFacade` SHALL include an optional `warnings` field. After computing all placements, the facade generator SHALL run the containment verifier and populate this field.

#### Scenario: Warnings field present on generated facade
- **WHEN** `generateFacade` produces a WallFacade for an exposed wall
- **THEN** the WallFacade SHALL have a `warnings` field (which MAY be an empty array)
