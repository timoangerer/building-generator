## MODIFIED Requirements

### Requirement: Plot generator stub
The system SHALL provide a `generatePlots(config: PlotConfig): PlotResult` function that uses seeded RNG to subdivide two rows into varying-width plots flanking a central street. The output SHALL validate against the PlotResult Zod schema and contain plots with widths within `[minPlotWidth, maxPlotWidth]`.

#### Scenario: Returns valid PlotResult
- **WHEN** `generatePlots` is called with any valid PlotConfig
- **THEN** the result SHALL pass PlotResult Zod schema validation

#### Scenario: Returns plots in both rows
- **WHEN** `generatePlots` is called
- **THEN** the result SHALL contain plots in both row A and row B

### Requirement: Massing generator stub
The system SHALL provide a `generateMassing(config: MassingConfig): MassingResult` function that extrudes each input plot footprint to a random height within the configured range, producing valid floors, wall segments, and party wall annotations. The output SHALL validate against the MassingResult Zod schema.

#### Scenario: Returns valid MassingResult
- **WHEN** `generateMassing` is called with valid input plots
- **THEN** the result SHALL pass MassingResult Zod schema validation

#### Scenario: Each plot produces a building
- **WHEN** `generateMassing` is called with N plot footprints
- **THEN** the result SHALL contain N BuildingMassing entries

### Requirement: Facade generator stub
The system SHALL provide a `generateFacade(config: FacadeConfig): FacadeResult` function that places window and door elements on exposed walls using a grid-bay grammar. Party walls SHALL have empty placement arrays. The output SHALL validate against the FacadeResult Zod schema.

#### Scenario: Returns valid FacadeResult with placements
- **WHEN** `generateFacade` is called with walls and available elements
- **THEN** the result SHALL pass FacadeResult Zod schema validation with non-empty placements on exposed walls
