## MODIFIED Requirements

### Requirement: Element contract types
The system SHALL define `ElementType` (union of "window", "door", "wall_panel"), `BoxGeometry`, `ElementGeometry`, `ElementDefinition`, `ElementCatalogConfig`, and `ElementCatalog` types. `ElementDefinition` SHALL include `elementId`, `type`, and `geometry`. `ElementGeometry` SHALL be a discriminated union supporting both `{ type: "box", box: BoxGeometry }` and `{ type: "composite", parts: GeometryPart[] }` variants. `ElementCatalog` SHALL include `config`, `elements`, and `defaultPalette` (ColorPalette).

#### Scenario: ElementCatalog contains element definitions and palette
- **WHEN** an ElementCatalog is validated
- **THEN** it SHALL contain a `config` with `seed`, an array of `elements` each having `elementId`, `type`, and `geometry`, and a `defaultPalette` mapping roles to colors

#### Scenario: ElementGeometry accepts composite variant
- **WHEN** an ElementGeometry with `type: "composite"` is validated
- **THEN** it SHALL be accepted if it contains a valid non-empty `parts` array

#### Scenario: ElementGeometry accepts box variant
- **WHEN** an ElementGeometry with `type: "box"` is validated
- **THEN** it SHALL be accepted if it contains a valid `box` with positive width, height, and depth
