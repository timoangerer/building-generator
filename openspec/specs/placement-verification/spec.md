# placement-verification Specification

## Purpose
Containment verification for facade element placements, detecting overflow and empty-bay conditions within the tile grid.

## Requirements
### Requirement: Containment verification
After element positions are resolved, the system SHALL verify that each element's effective bounding box (accounting for position, bounds, and scale) fits within its tile rect. Elements that extend beyond tile boundaries SHALL produce a `PlacementWarning`.

#### Scenario: Element within bounds produces no warning
- **WHEN** an element with bbox 1.0m × 1.5m is placed centered in a 2.5m × 3.0m tile
- **THEN** no containment warning SHALL be produced

#### Scenario: Element overflowing top produces warning
- **WHEN** an element's top edge extends 0.2m above the tile top boundary
- **THEN** a warning with type "overflow-top" and overflowAmount 0.2 SHALL be produced

#### Scenario: Element overflowing bottom produces warning
- **WHEN** an element's bottom edge extends 0.15m below the tile bottom boundary
- **THEN** a warning with type "overflow-bottom" and overflowAmount 0.15 SHALL be produced

#### Scenario: Element overflowing left or right produces warning
- **WHEN** an element's left edge extends beyond the tile left boundary
- **THEN** a warning with type "overflow-left" SHALL be produced

### Requirement: Overflow tolerance
The containment verifier SHALL accept a tolerance parameter (default 0.02m). Overflow amounts less than or equal to the tolerance SHALL NOT produce warnings.

#### Scenario: Overflow within tolerance produces no warning
- **WHEN** an element extends 0.01m beyond the tile top with default tolerance 0.02m
- **THEN** no warning SHALL be produced

#### Scenario: Overflow exceeding tolerance produces warning
- **WHEN** an element extends 0.05m beyond the tile top with default tolerance 0.02m
- **THEN** a warning with overflowAmount 0.05 SHALL be produced

### Requirement: Warning data structure
Each `PlacementWarning` SHALL contain: `floorIndex` (number), `bayIndex` (number), `elementId` (string), `type` (one of "overflow-top", "overflow-bottom", "overflow-left", "overflow-right", "empty-bay"), and `overflowAmount` (number, meters, present for overflow types).

#### Scenario: Warning contains all required fields
- **WHEN** a containment violation is detected for element "balcony-door-iron" at floor 1, bay 2
- **THEN** the warning SHALL contain floorIndex: 1, bayIndex: 2, elementId: "balcony-door-iron", type: "overflow-top", and a numeric overflowAmount

### Requirement: Empty bay detection
When a bay × floor cell has no element placed (either because element selection returned null or was skipped), the verifier SHALL produce a warning with type "empty-bay".

#### Scenario: Missing element produces empty-bay warning
- **WHEN** a bay × floor cell on an exposed wall has no element placed
- **THEN** a warning with type "empty-bay" SHALL be produced for that floorIndex and bayIndex

### Requirement: Warnings on WallFacade
`WallFacade` SHALL include an optional `warnings` field of type `PlacementWarning[]`. The facade generator SHALL populate this field with results from the containment verifier.

#### Scenario: WallFacade includes warnings array
- **WHEN** a facade is generated and containment violations exist
- **THEN** the `WallFacade.warnings` array SHALL contain one entry per violation

#### Scenario: Clean facade has empty warnings
- **WHEN** all elements fit within their tiles
- **THEN** `WallFacade.warnings` SHALL be an empty array

### Requirement: All fixture seeds produce zero overflow warnings
After the placement model is correctly implemented with proper offset accounting, all 5 existing test fixture seeds SHALL produce facades with zero overflow warnings (using default tolerance).

#### Scenario: Fixture seeds are overflow-free
- **WHEN** `generateFacade` is run for each of the 5 fixture seeds
- **THEN** every WallFacade in every result SHALL have zero warnings of overflow type
