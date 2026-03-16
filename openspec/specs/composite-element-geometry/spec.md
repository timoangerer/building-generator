# composite-element-geometry Specification

## Purpose
TBD - created by archiving change mediterranean-elements. Update Purpose after archive.
## Requirements
### Requirement: Composite geometry type
The `ElementGeometry` union SHALL support a `"composite"` variant: `{ type: "composite", parts: GeometryPart[] }`. The `parts` array SHALL contain at least one `GeometryPart`.

#### Scenario: Composite geometry contains parts
- **WHEN** an ElementGeometry of type "composite" is validated
- **THEN** it SHALL have a non-empty `parts` array of GeometryPart objects

#### Scenario: Box geometry remains valid
- **WHEN** an ElementGeometry of type "box" is validated
- **THEN** it SHALL still be accepted unchanged

### Requirement: GeometryPart structure
Each `GeometryPart` SHALL have: a `shape` field (one of `"box"`, `"cylinder"`, `"half_cylinder"`), a `dimensions` object appropriate to the shape, a `role` string tag, and a `position` offset as `Vec3` relative to the element origin.

#### Scenario: Box-shaped part
- **WHEN** a GeometryPart has shape "box"
- **THEN** its dimensions SHALL include `width`, `height`, and `depth`, all positive numbers

#### Scenario: Cylinder-shaped part
- **WHEN** a GeometryPart has shape "cylinder"
- **THEN** its dimensions SHALL include `radius` and `height`, both positive numbers

#### Scenario: Half-cylinder-shaped part
- **WHEN** a GeometryPart has shape "half_cylinder"
- **THEN** its dimensions SHALL include `radius` and `depth`, both positive numbers

#### Scenario: Part position offset
- **WHEN** a GeometryPart is validated
- **THEN** it SHALL have a `position` field with finite `x`, `y`, `z` values representing offset from element origin

### Requirement: Semantic role tags
Each GeometryPart SHALL carry a `role` string. Recognized roles SHALL include `"pane"`, `"frame"`, `"shutter"`, `"sill"`, `"panel"`, `"railing"`, `"slab"`, and `"arch"`. Custom role strings SHALL also be accepted.

#### Scenario: Known roles accepted
- **WHEN** a GeometryPart has role "shutter"
- **THEN** validation SHALL succeed

#### Scenario: Custom roles accepted
- **WHEN** a GeometryPart has role "decorative_trim"
- **THEN** validation SHALL succeed (role is a free-form string)

### Requirement: Mediterranean element catalog
The element generator SHALL produce a catalog containing the following self-contained elements when given a seed. Window elements SHALL use realistic Mediterranean residential dimensions:

| Element ID | Type | Description |
|---|---|---|
| window-tall | window | Rectangular window (~0.9w × 1.6h) |
| window-arched | window | Tall window with semicircular arch top (~0.9w × ~2.0h) |
| window-shuttered | window | Tall window with flanking shutters and sill (~0.9w + shutters × 1.5h) |
| window-arch-shut | window | Arched window with shutters and sill (~0.9w + shutters × ~2.0h) |
| window-small-sq | window | Small square window (~0.6w × 0.6h) |
| door-arched | door | Wide arched entry door |
| door-paneled | door | Simple paneled door with frame |
| balcony-door-iron | door | French door with thin slab and iron-style railing |
| balcony-door-stone | door | French door with thick slab and stone balustrade |

#### Scenario: Catalog contains all Mediterranean elements
- **WHEN** the element generator produces a catalog
- **THEN** the catalog SHALL contain exactly the 9 element IDs listed above

#### Scenario: Balcony doors are self-contained
- **WHEN** the element "balcony-door-iron" is inspected
- **THEN** its composite geometry SHALL include parts for the door panes AND the balcony slab AND the railing, all as parts of a single element

#### Scenario: Shuttered windows include shutters
- **WHEN** the element "window-shuttered" is inspected
- **THEN** its composite geometry SHALL include parts with role "pane" AND parts with role "shutter" AND a part with role "sill"

#### Scenario: Arched elements include arch geometry
- **WHEN** the element "window-arched" is inspected
- **THEN** its composite geometry SHALL include at least one part with shape "half_cylinder" and role "arch"

#### Scenario: Window-tall has realistic dimensions
- **WHEN** the element "window-tall" is inspected
- **THEN** its frame part SHALL have width approximately 0.9 and height approximately 1.6

#### Scenario: Window-arched has realistic dimensions
- **WHEN** the element "window-arched" is inspected
- **THEN** its frame part SHALL have width approximately 0.9 and its total height (frame + arch) SHALL be approximately 2.0

#### Scenario: Window-small-sq has realistic dimensions
- **WHEN** the element "window-small-sq" is inspected
- **THEN** its frame part SHALL have width approximately 0.6 and height approximately 0.6

### Requirement: Deterministic catalog generation
The element generator SHALL produce identical catalogs when given the same seed.

#### Scenario: Same seed same output
- **WHEN** the element generator is called twice with seed 42
- **THEN** both catalogs SHALL be deeply equal

### Requirement: Catalog validates against Zod schema
The generated element catalog SHALL pass validation against the updated ElementCatalog Zod schema, including composite geometry parts.

#### Scenario: Generated catalog passes schema validation
- **WHEN** the generated catalog is parsed with the ElementCatalog Zod schema
- **THEN** parsing SHALL succeed without errors

