## ADDED Requirements

### Requirement: Plot generator stub
The system SHALL provide a `generatePlots(config: PlotConfig): PlotResult` function that returns a valid PlotResult with at least 2 rectangular plots and 1 street. The output SHALL validate against the PlotResult Zod schema.

#### Scenario: Stub returns valid PlotResult
- **WHEN** `generatePlots` is called with any valid PlotConfig
- **THEN** the result SHALL pass PlotResult Zod schema validation

#### Scenario: Stub returns multiple plots
- **WHEN** `generatePlots` is called
- **THEN** the result SHALL contain at least 2 plots

### Requirement: Massing generator stub
The system SHALL provide a `generateMassing(config: MassingConfig): MassingResult` function that extrudes each input plot footprint to a fixed height, producing valid floors and wall segments. The output SHALL validate against the MassingResult Zod schema.

#### Scenario: Stub returns valid MassingResult
- **WHEN** `generateMassing` is called with valid input plots
- **THEN** the result SHALL pass MassingResult Zod schema validation

#### Scenario: Each plot produces a building
- **WHEN** `generateMassing` is called with N plot footprints
- **THEN** the result SHALL contain N BuildingMassing entries

### Requirement: Element catalog generator stub
The system SHALL provide a `generateElementCatalog(config: ElementCatalogConfig): ElementCatalog` function that returns a fixed catalog containing at least: window-small, window-large, door-standard, and wall-panel elements with BoxGeometry.

#### Scenario: Stub returns fixed catalog
- **WHEN** `generateElementCatalog` is called
- **THEN** the result SHALL contain elements with IDs "window-small", "window-large", "door-standard", and "wall-panel"

#### Scenario: All elements have valid geometry
- **WHEN** the catalog is validated
- **THEN** every element SHALL have a BoxGeometry with positive width, height, and depth

### Requirement: Facade generator stub
The system SHALL provide a `generateFacade(config: FacadeConfig): FacadeResult` function that returns a valid FacadeResult with empty placement arrays (no elements placed yet). The output SHALL validate against the FacadeResult Zod schema.

#### Scenario: Stub returns valid but empty facades
- **WHEN** `generateFacade` is called
- **THEN** the result SHALL pass FacadeResult Zod schema validation with empty `placements` arrays

### Requirement: Building assembler stub
The system SHALL provide an `assembleBuildings(config: BuildingConfig, massings: BuildingMassing[], facades: WallFacade[]): BuildingResult` function that joins massing and facade data into Building objects.

#### Scenario: Assembler joins massing and facades
- **WHEN** `assembleBuildings` is called with massings and facades
- **THEN** each Building in the result SHALL contain its corresponding massing and facades

### Requirement: Scene composer stub
The system SHALL provide a `composeScene(config: SceneConfig, buildings: Building[], streets: Street[], catalog: ElementCatalog): SceneResult` function that bundles all data into a SceneResult with computed sceneBounds.

#### Scenario: Scene contains all inputs
- **WHEN** `composeScene` is called
- **THEN** the SceneResult SHALL contain the input buildings, streets, and elementCatalog

### Requirement: All stubs are deterministic
Every stub generator SHALL accept a seed in its config and SHALL produce identical output for identical inputs. No stub SHALL use `Math.random()`.

#### Scenario: Same seed produces same output
- **WHEN** any stub generator is called twice with the same config (including seed)
- **THEN** both outputs SHALL be deeply equal
