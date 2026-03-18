# tile-placement Specification

## Purpose
Anchor/origin-based placement resolver for positioning facade elements within tile rects, with element-type defaults and bounding box offset accounting.

## Requirements
### Requirement: Anchor and origin placement model
The tile placement system SHALL resolve element positions within a tile using three inputs: an **anchor** (a named position on the tile rect), an **origin** (a named position on the element bounding box), and an optional **offset** (x, y displacement in tile-local coords). The resolved position SHALL align the origin point on the element to the anchor point on the tile, then apply the offset.

#### Scenario: Center anchor with center origin
- **WHEN** anchor is "center", origin is "center", tile is 2.5m × 3.0m, element bbox is 1.0m × 1.5m
- **THEN** the element center SHALL be at tile center (1.25, 1.5)

#### Scenario: Bottom-center anchor with bottom-center origin
- **WHEN** anchor is "bottom-center", origin is "bottom-center", tile is 2.5m × 3.0m, element bbox is 1.0m × 2.0m
- **THEN** the element bottom-center SHALL be at tile bottom-center — element position (1.25, 1.0)

#### Scenario: Bottom-center anchor with offset
- **WHEN** anchor is "bottom-center", origin is "bottom-center", offset is {x: 0, y: 0.9}, tile is 2.5m × 3.0m, element bbox is 0.9m × 1.6m
- **THEN** the element bottom SHALL be at 0.9m above tile bottom — element position (1.25, 1.7)

#### Scenario: Top-center anchor with top-center origin
- **WHEN** anchor is "top-center", origin is "top-center", tile is 2.5m × 3.0m, element bbox is 1.0m × 1.5m
- **THEN** the element top-center SHALL be at tile top-center — element position (1.25, 2.25)

### Requirement: Named anchor positions
The system SHALL support 9 named anchor/origin positions: `"top-left"`, `"top-center"`, `"top-right"`, `"middle-left"`, `"center"`, `"middle-right"`, `"bottom-left"`, `"bottom-center"`, `"bottom-right"`. These map to the corresponding corners, edge midpoints, and center of the rectangle.

#### Scenario: All 9 positions resolve to correct coordinates
- **WHEN** a 4.0m × 2.0m tile is used with each of the 9 anchor positions
- **THEN** top-left SHALL resolve to (0, 2), top-center to (2, 2), top-right to (4, 2), middle-left to (0, 1), center to (2, 1), middle-right to (4, 1), bottom-left to (0, 0), bottom-center to (2, 0), bottom-right to (4, 0)

### Requirement: Bounding box offset accounting
When an element's bounding box center differs from its geometry origin (i.e., `bounds.offsetX` or `bounds.offsetY` is non-zero), the placement resolver SHALL account for this offset so that the element's visual bounding box aligns to the intended anchor, not just the geometry origin.

#### Scenario: Element with negative offsetY
- **WHEN** an element has bounds {width: 1.2, height: 2.24, offsetY: -0.5} and placement rule {anchor: "bottom-center", origin: "bottom-center"}
- **THEN** the resolved position SHALL shift upward by 0.5 so the visual bottom of the bbox (not the geometry origin) aligns to the tile bottom

#### Scenario: Element with zero offset
- **WHEN** an element has bounds {offsetX: 0, offsetY: 0}
- **THEN** the resolved position SHALL be identical to the case without offset accounting

### Requirement: Element-type default placement rules
Each `ElementType` SHALL have a default placement rule that is used when no explicit override is provided. The defaults SHALL be: `door` → anchor "bottom-center", origin "bottom-center"; `window` → anchor "bottom-center", origin "bottom-center", offset {x: 0, y: sillHeight}; `wall_panel` → anchor "center", origin "center".

#### Scenario: Door element uses bottom-center default
- **WHEN** a door element is placed with no explicit rule
- **THEN** the placement resolver SHALL use anchor "bottom-center", origin "bottom-center" — the door bottom touches the tile bottom

#### Scenario: Window element uses sill-height default
- **WHEN** a window element is placed with no explicit rule and sillHeight is 0.9
- **THEN** the placement resolver SHALL use anchor "bottom-center", origin "bottom-center", offset {y: 0.9} — the window bottom is 0.9m above tile bottom

### Requirement: Placement rule override
The facade grammar SHALL allow overriding the default placement rule for a specific tile. When an override is provided, it SHALL take precedence over the element-type default.

#### Scenario: Override anchor for window
- **WHEN** a window element is placed with explicit rule {anchor: "center", origin: "center"}
- **THEN** the resolver SHALL center the window in the tile, ignoring the sill-height default

### Requirement: Deterministic placement resolution
The `resolveTilePlacement` function SHALL be a pure function: given the same tile dimensions, element bounds, and placement rule, it SHALL always return the same position.

#### Scenario: Repeated calls return same result
- **WHEN** `resolveTilePlacement` is called twice with identical inputs
- **THEN** both calls SHALL return deeply equal positions
