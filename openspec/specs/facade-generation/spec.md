# facade-generation Specification

## Purpose
TBD - procedural facade generation that places window and door elements on exposed building walls using a grid-bay grammar.

## Requirements
### Requirement: Grid-bay facade placement
The facade generator SHALL divide each exposed wall into bays of width `bayWidth` with `edgeMargin` on each side, and place one element per bay per floor.

#### Scenario: Bay count computation
- **WHEN** a wall has length 10, edgeMargin 0.5, bayWidth 2.5
- **THEN** usable width is 9.0 and the wall SHALL have `floor(9.0 / 2.5) = 3` bays

#### Scenario: Element placement at bay centers
- **WHEN** elements are placed on a wall
- **THEN** each placement's position SHALL be at the center of its bay horizontally and at the center of its floor vertically

### Requirement: Party walls have no placements
Walls with `neighborBuildingId` set SHALL produce a WallFacade with an empty `placements` array.

#### Scenario: Party wall skipped
- **WHEN** a wall has `neighborBuildingId` set
- **THEN** the corresponding WallFacade SHALL have `placements.length === 0`

### Requirement: Ground floor doors
On the ground floor (floorIndex 0) of each exposed wall, the center bay(s) SHALL receive a door element. All other bays SHALL receive window elements.

#### Scenario: Door on ground floor center
- **WHEN** an exposed wall has 3 bays
- **THEN** the ground floor center bay (index 1) SHALL have a door element, and bays 0 and 2 SHALL have window elements

#### Scenario: Upper floors have only windows
- **WHEN** elements are placed on floors above ground
- **THEN** all placements SHALL reference window-type elements

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
