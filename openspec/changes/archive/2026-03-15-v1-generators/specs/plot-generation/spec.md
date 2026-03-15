## ADDED Requirements

### Requirement: Seeded random plot subdivision
The plot generator SHALL use the seeded RNG from `src/utils/seed.ts` to subdivide each row into plots with random widths in `[minPlotWidth, maxPlotWidth]`, packed left-to-right along X until the row is filled.

#### Scenario: Plots fill the street length
- **WHEN** `generatePlots` is called with `streetLength: 30, minPlotWidth: 8, maxPlotWidth: 14`
- **THEN** the sum of all plot widths in each row SHALL equal `streetLength`

#### Scenario: Plot widths are within configured range
- **WHEN** `generatePlots` is called
- **THEN** every plot except possibly the last in each row SHALL have width in `[minPlotWidth, maxPlotWidth]`

#### Scenario: Last plot absorbs remainder
- **WHEN** the remaining width after packing is less than `maxPlotWidth`
- **THEN** the last plot in the row SHALL receive the remaining width, clamped to at least `minPlotWidth`

### Requirement: Two-row layout flanking a central street
The plot generator SHALL produce two rows of plots (row A at positive Z, row B at negative Z) flanking a central street rectangle centered at z=0.

#### Scenario: Street centered at z=0
- **WHEN** `generatePlots` is called
- **THEN** the street rectangle SHALL span `streetLength` along X and `streetWidth` along Z, centered at z=0

#### Scenario: Row A above street, row B below
- **WHEN** `generatePlots` is called
- **THEN** all row A plots SHALL have z coordinates above the street's positive edge, and all row B plots SHALL have z coordinates below the street's negative edge

### Requirement: All plots are valid non-overlapping rectangles
Every plot SHALL be a rectangle with 4 vertices and positive area. No two plots SHALL overlap.

#### Scenario: Valid rectangles
- **WHEN** the plot result is inspected
- **THEN** every plot SHALL have exactly 4 vertices forming a rectangle with positive area

#### Scenario: No overlaps
- **WHEN** the plot result is inspected
- **THEN** no two plot bounding boxes SHALL intersect

### Requirement: Deterministic output
The plot generator SHALL produce identical output for identical inputs including seed.

#### Scenario: Same seed produces same output
- **WHEN** `generatePlots` is called twice with the same config
- **THEN** both outputs SHALL be deeply equal
