## ADDED Requirements

### Requirement: Random floor count per building
The massing generator SHALL use the seeded RNG to pick a floor count within `floorCountRange` independently for each building.

#### Scenario: Floor count varies between buildings
- **WHEN** `generateMassing` is called with `floorCountRange: [3, 5]` and multiple plots
- **THEN** different buildings MAY have different floor counts, all within [3, 5]

#### Scenario: Floor baseY values are monotonically increasing
- **WHEN** a building's floors are inspected
- **THEN** `floors[i].baseY < floors[i+1].baseY` for all consecutive floors

### Requirement: Height variation
The massing generator SHALL apply a random height offset within `±heightVariation` to each building's total height.

#### Scenario: Total height reflects variation
- **WHEN** `generateMassing` is called with `floorHeight: 3, floorCountRange: [3,3], heightVariation: 0.5`
- **THEN** each building's `totalHeight` SHALL be within `[3*3 - 0.5, 3*3 + 0.5]`

### Requirement: Party wall detection
After creating all buildings, the massing generator SHALL detect shared walls between adjacent buildings. Two axis-aligned walls are shared if they lie on the same line (same X or Z coordinate within epsilon) and overlap in the other axis. Shared walls SHALL have `neighborBuildingId` set.

#### Scenario: Adjacent plots share a wall
- **WHEN** two plots share an edge (e.g., plot-A1 right edge = plot-A2 left edge)
- **THEN** the corresponding wall segments SHALL have `neighborBuildingId` referencing each other

#### Scenario: Party walls are symmetric
- **WHEN** wall W1 of building A has `neighborBuildingId = B`
- **THEN** the corresponding wall of building B SHALL have `neighborBuildingId = A`

### Requirement: Walls form closed perimeter
Every building SHALL have exactly 4 wall segments forming a closed rectangle. The end of wall N SHALL equal the start of wall N+1 (cyclically).

#### Scenario: Closed perimeter
- **WHEN** a building's walls are inspected
- **THEN** `walls[i].end` SHALL equal `walls[(i+1) % 4].start` for all i

#### Scenario: Outward-pointing normals
- **WHEN** a building's wall normals are inspected
- **THEN** each normal SHALL be a unit vector pointing away from the building's interior

### Requirement: Deterministic output
The massing generator SHALL produce identical output for identical inputs including seed.

#### Scenario: Same seed produces same output
- **WHEN** `generateMassing` is called twice with the same config
- **THEN** both outputs SHALL be deeply equal
