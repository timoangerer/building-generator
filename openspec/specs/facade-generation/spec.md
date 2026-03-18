# facade-generation Specification

## Purpose
Procedural facade generation that places window and door elements on exposed building walls using a bay-grid grammar with per-building style variation.
## Requirements
### Requirement: Grid-bay facade placement
The facade generator SHALL divide each exposed wall into bays of width `bayWidth` with `edgeMargin` on each side, and place one element per bay per floor.

#### Scenario: Bay count computation
- **WHEN** a wall has length 10, edgeMargin 0.5, bayWidth 2.5
- **THEN** usable width is 9.0 and the wall SHALL have `floor(9.0 / 2.5) = 3` bays

#### Scenario: Element placement at bay centers
- **WHEN** elements are placed on a wall
- **THEN** each placement's horizontal position SHALL be at the center of its bay, and vertical position SHALL be determined by `resolveTilePlacement`

### Requirement: Party walls have no placements
Walls with `neighborBuildingId` set SHALL produce a WallFacade with an empty `placements` array.

#### Scenario: Party wall skipped
- **WHEN** a wall has `neighborBuildingId` set
- **THEN** the corresponding WallFacade SHALL have `placements.length === 0`

### Requirement: Ground floor doors
On the ground floor (floorIndex 0) of each exposed wall, the center bay(s) SHALL receive a door element selected via seeded RNG from entry door elements (non-balcony doors). All other ground floor bays SHALL receive the building's primary window element.

#### Scenario: Door on ground floor center
- **WHEN** an exposed wall has 3 bays
- **THEN** the ground floor center bay (index 1) SHALL have a door element, and bays 0 and 2 SHALL have window elements

#### Scenario: Upper floors have only windows or balcony doors
- **WHEN** elements are placed on floors above ground
- **THEN** all placements SHALL reference window-type elements or balcony-door elements

### Requirement: Valid element references
Every placement SHALL reference an elementId that exists in `availableElements`.

#### Scenario: All placements reference valid elements
- **WHEN** the facade result is inspected
- **THEN** every `placement.elementId` SHALL match an element in the `availableElements` array

### Requirement: Finite coordinates
All placement positions SHALL have finite coordinates (no NaN or Infinity).

#### Scenario: No invalid coordinates
- **WHEN** the facade result is inspected
- **THEN** every placement position x, y, z and rotationY SHALL be finite numbers

### Requirement: Correct world-space transform
Placements SHALL be positioned in world space using the wall's start point, direction, and normal. The rotationY SHALL orient the element to face outward from the wall.

#### Scenario: Position along wall direction
- **WHEN** a placement is computed for bay at offset `u` along a wall starting at `start` with direction `dir`
- **THEN** `position.x = start.x + u * dir.x` and `position.z = start.z + u * dir.z`

#### Scenario: rotationY faces outward
- **WHEN** a placement is computed for a wall with normal `(nx, nz)`
- **THEN** `rotationY = atan2(nx, nz)`

### Requirement: Deterministic output
The facade generator SHALL produce identical output for identical inputs including seed.

#### Scenario: Same seed produces same output
- **WHEN** `generateFacade` is called twice with the same config
- **THEN** both outputs SHALL be deeply equal

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

### Requirement: Seeded element selection variety
The facade generator SHALL select multiple element types per building using seeded RNG rather than always using the first window and first door. Per building, it SHALL pick a "primary window" and "accent window" from the available window elements.

#### Scenario: Uses more than one unique window element
- **WHEN** the facade generator processes a scene with multiple buildings
- **THEN** the combined placements across all buildings SHALL reference at least 2 distinct window element IDs

#### Scenario: Primary and accent windows differ
- **WHEN** a building's facade is generated with at least 3 available window elements
- **THEN** the primary and accent window selections SHALL be different element IDs

### Requirement: Per-floor element assignment rules
The facade generator SHALL apply per-floor rules for element assignment:
- **Ground floor**: center bay = entry door (seeded pick), other bays = primary window
- **Middle floors**: most bays = primary window, 1-2 accent bays = accent window or balcony door
- **Top floor**: primary window or window-small-sq for variation

#### Scenario: Middle floors have accent elements
- **WHEN** a building has 3+ floors and 3+ bays per wall
- **THEN** at least one middle floor bay SHALL have an element different from the primary window

#### Scenario: Top floor may use small windows
- **WHEN** a building has 3+ floors
- **THEN** the top floor MAY use window-small-sq elements for variation (seed-dependent)

### Requirement: Bay grid inspection artifact
The facade generator SHALL populate `WallFacade.bayGrid` with the element assignment for each floor/bay cell on exposed walls.

#### Scenario: Bay grid covers all floor/bay cells
- **WHEN** an exposed wall has 3 bays and 3 floors
- **THEN** `bayGrid` SHALL contain exactly 9 entries covering all (floorIndex, bayIndex) combinations

#### Scenario: Bay grid element IDs match placements
- **WHEN** `bayGrid` is populated
- **THEN** each `bayGrid` entry's `elementId` SHALL match the corresponding placement's `elementId`

### Requirement: Optional proportional scaling
When an element's bounds do not fill its bay well, the generator MAY set a uniform `scale` on the placement. The scale factor SHALL be computed as `min(bayWidth * 0.8 / bounds.width, floorHeight * 0.7 / bounds.height, 1.5)` and SHALL only be set when the factor exceeds 1.05.

#### Scenario: Scale not set when element fits bay
- **WHEN** an element's bounds width is greater than `bayWidth * 0.8 / 1.05`
- **THEN** the placement SHALL NOT have a `scale` field set

#### Scenario: All placements with scale have positive scale
- **WHEN** any placement has a `scale` field set
- **THEN** all components of `scale` SHALL be greater than zero

### Requirement: WallFacade includes placement warnings
`WallFacade` SHALL include an optional `warnings` field. After computing all placements, the facade generator SHALL run the containment verifier and populate this field.

#### Scenario: Warnings field present on generated facade
- **WHEN** `generateFacade` produces a WallFacade for an exposed wall
- **THEN** the WallFacade SHALL have a `warnings` field (which MAY be an empty array)

