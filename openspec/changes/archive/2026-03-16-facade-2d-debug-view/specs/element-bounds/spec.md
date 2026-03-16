# element-bounds Specification

## Purpose
Utility to compute axis-aligned bounding boxes from composite element geometry, used by the 2D renderer, Y-position logic, and proportional scaling.

## ADDED Requirements

### Requirement: Compute element bounding box
The `computeElementBounds` function SHALL accept an `ElementDefinition` and return an `ElementBounds` object with `width`, `height`, and `depth` representing the axis-aligned bounding box of all geometry parts combined.

#### Scenario: Single box part
- **WHEN** an element has a single box part at position (0,0,0) with dimensions 0.6w × 1.3h × 0.08d
- **THEN** `computeElementBounds` SHALL return `{ width: 0.6, height: 1.3, depth: 0.08 }`

#### Scenario: Multiple parts with offsets
- **WHEN** an element has parts at different positions (e.g., shutters offset left and right of center)
- **THEN** the bounds SHALL encompass all parts, computed as max extent minus min extent on each axis

#### Scenario: Sill overhang extends width
- **WHEN** the `window-tall` element is inspected (frame 0.6w, sill 0.7w)
- **THEN** `computeElementBounds` SHALL return a width of at least 0.7 (the sill overhang)

### Requirement: Handle all geometry shapes
The bounds computation SHALL handle `box`, `cylinder`, and `half_cylinder` part shapes, using each shape's dimensions to compute its axis-aligned extent.

#### Scenario: Cylinder part bounds
- **WHEN** a part has shape "cylinder" with radius 0.25 and height 0.03
- **THEN** its contribution to the bounding box SHALL span `2*radius` in width and depth, and `height` in the Y axis

#### Scenario: Half-cylinder part bounds
- **WHEN** a part has shape "half_cylinder" with radius 0.25 and depth 0.03
- **THEN** its contribution to the bounding box SHALL span `2*radius` in width, `radius` in height (semicircle), and `depth` in depth

### Requirement: Positive dimensions
The returned bounds SHALL always have positive `width`, `height`, and `depth` values.

#### Scenario: No zero-size bounds
- **WHEN** `computeElementBounds` is called on any valid element
- **THEN** all three dimensions SHALL be greater than zero
