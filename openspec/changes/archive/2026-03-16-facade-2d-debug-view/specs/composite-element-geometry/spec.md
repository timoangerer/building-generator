# composite-element-geometry Delta Spec

## MODIFIED Requirements

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
