# facade-generation Delta Spec

## MODIFIED Requirements

### Requirement: Ground floor doors
On the ground floor (floorIndex 0) of each exposed wall, the center bay(s) SHALL receive a door element selected via seeded RNG from entry door elements (non-balcony doors). All other ground floor bays SHALL receive the building's primary window element.

#### Scenario: Door on ground floor center
- **WHEN** an exposed wall has 3 bays
- **THEN** the ground floor center bay (index 1) SHALL have a door element, and bays 0 and 2 SHALL have window elements

#### Scenario: Upper floors have only windows or balcony doors
- **WHEN** elements are placed on floors above ground
- **THEN** all placements SHALL reference window-type elements or balcony-door elements

## ADDED Requirements

### Requirement: Element placement at bay centers
Each placement's horizontal position SHALL be at the center of its bay. Vertical position SHALL depend on element type: doors SHALL have their bottom at the floor base (`y = floor.baseY + bounds.height / 2`), and windows SHALL have their sill at approximately 0.9m above floor base (`y = floor.baseY + 0.9 + bounds.height / 2`).

#### Scenario: Door Y position near floor base
- **WHEN** a door element is placed on a floor with baseY = 0
- **THEN** the placement's `position.y` SHALL approximately equal `bounds.height / 2` (bottom touching floor)

#### Scenario: Window Y position at sill height
- **WHEN** a window element is placed on a floor with baseY = 0
- **THEN** the placement's `position.y` SHALL approximately equal `0.9 + bounds.height / 2`

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
