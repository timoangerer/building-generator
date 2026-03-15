# element-role-palettes Specification

## Purpose
TBD - created by archiving change mediterranean-elements. Update Purpose after archive.
## Requirements
### Requirement: ColorPalette type
The system SHALL define a `ColorPalette` type that maps role strings to hex color numbers. The palette SHALL provide a color for every recognized role.

#### Scenario: Palette maps roles to colors
- **WHEN** a ColorPalette is created
- **THEN** it SHALL contain entries mapping role strings (e.g., "pane", "shutter", "sill") to numeric hex color values

### Requirement: Default Mediterranean palette
The element catalog SHALL include a `defaultPalette` field of type `ColorPalette` that provides colors for all roles used by the catalog's elements.

#### Scenario: Default palette covers all element roles
- **WHEN** the element catalog is generated
- **THEN** every role string used in any element's geometry parts SHALL have a corresponding entry in the default palette

#### Scenario: Mediterranean color values
- **WHEN** the default palette is inspected
- **THEN** pane colors SHALL be dark (suggesting glass), shutter colors SHALL be a muted accent (blue, green, or terracotta range), sill colors SHALL be light (suggesting stone), and panel/frame colors SHALL be warm wood or neutral tones

### Requirement: Palette included in ElementCatalog
The `ElementCatalog` type SHALL include a `defaultPalette` field of type `ColorPalette`.

#### Scenario: Catalog serialization includes palette
- **WHEN** an ElementCatalog is serialized to JSON
- **THEN** the JSON SHALL include the `defaultPalette` object with role-to-color mappings

