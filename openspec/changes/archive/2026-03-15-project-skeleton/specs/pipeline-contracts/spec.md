## ADDED Requirements

### Requirement: Base geometric primitives
The system SHALL define shared geometric types: `Vec2` (with fields `x` and `z` for the XZ ground plane), `Vec3` (with fields `x`, `y`, `z`), `Polygon2D` (array of `Vec2`, CCW order, no duplicate closing vertex, minimum 3 vertices), and `AABB2` (with `min` and `max` Vec2 fields).

#### Scenario: Vec2 represents ground plane coordinates
- **WHEN** a Vec2 value is created
- **THEN** it SHALL have numeric `x` and `z` fields (not `x` and `y`)

#### Scenario: Polygon2D minimum vertex count
- **WHEN** a Polygon2D is validated
- **THEN** it SHALL contain at least 3 vertices

### Requirement: Plot contract types
The system SHALL define `PlotConfig`, `Plot`, `Street`, and `PlotResult` types. `PlotConfig` SHALL include `seed`, `streetLength`, `streetWidth`, `plotDepth`, `minPlotWidth`, and `maxPlotWidth`. `Plot` SHALL include `id`, `footprint` (Polygon2D), `bounds` (AABB2), and `row` ("A" or "B"). `PlotResult` SHALL include `config`, `plots`, and `streets`.

#### Scenario: PlotResult contains config and outputs
- **WHEN** a PlotResult is validated
- **THEN** it SHALL contain the originating `config`, an array of `plots`, and an array of `streets`

### Requirement: Massing contract types
The system SHALL define `MassingConfig`, `FloorInfo`, `WallSegment`, `BuildingMassing`, and `MassingResult` types. `MassingConfig` SHALL include `seed`, `plots` (array with plotId and footprint), `floorHeight`, `floorCountRange` (tuple), and `heightVariation`. `WallSegment` SHALL include `buildingId`, `wallIndex`, `start`, `end`, `height`, `length`, optional `neighborBuildingId`, and `normal`. `BuildingMassing` SHALL include `buildingId`, `plotId`, `footprint`, `totalHeight`, `floors`, and `walls`.

#### Scenario: WallSegment has required geometric fields
- **WHEN** a WallSegment is validated
- **THEN** it SHALL have `start` (Vec2), `end` (Vec2), `height` (number), `length` (number), and `normal` (Vec2)

### Requirement: Element contract types
The system SHALL define `ElementType` (union of "window", "door", "wall_panel"), `BoxGeometry`, `ElementGeometry`, `ElementDefinition`, `ElementCatalogConfig`, and `ElementCatalog` types. `ElementDefinition` SHALL include `elementId`, `type`, and `geometry`.

#### Scenario: ElementCatalog contains element definitions
- **WHEN** an ElementCatalog is validated
- **THEN** it SHALL contain a `config` with `seed` and an array of `elements` each having `elementId`, `type`, and `geometry`

### Requirement: Facade contract types
The system SHALL define `FacadeConfig`, `ElementPlacement`, `WallFacade`, and `FacadeResult` types. `FacadeConfig` SHALL include `seed`, `walls`, `floors`, `availableElements`, `bayWidth`, and `edgeMargin`. `ElementPlacement` SHALL include `elementId`, `position` (Vec3), and `rotationY`. `WallFacade` SHALL include `buildingId`, `wallIndex`, and `placements`.

#### Scenario: FacadeResult contains wall facades
- **WHEN** a FacadeResult is validated
- **THEN** it SHALL contain a `config` and an array of `facades`, each with `buildingId`, `wallIndex`, and `placements`

### Requirement: Building contract types
The system SHALL define `BuildingConfig`, `Building`, and `BuildingResult` types. `Building` SHALL include `buildingId`, `plotId`, `massing` (BuildingMassing), and `facades` (array of WallFacade).

#### Scenario: Building joins massing and facades
- **WHEN** a Building is validated
- **THEN** it SHALL contain both a `massing` object and a `facades` array

### Requirement: Scene contract types
The system SHALL define `SceneConfig`, `Scene`, and `SceneResult` types. `Scene` SHALL include `buildings`, `streets`, `elementCatalog`, and `sceneBounds` (AABB2).

#### Scenario: Scene bundles all pipeline outputs
- **WHEN** a Scene is validated
- **THEN** it SHALL contain `buildings`, `streets`, `elementCatalog`, and `sceneBounds`

### Requirement: Zod schemas co-located with contract types
Each contract file SHALL have a co-located `*.schema.ts` file containing Zod schemas that mirror the TypeScript types exactly. Schemas SHALL be usable for runtime validation in tests.

#### Scenario: Schema validates matching type
- **WHEN** a valid contract object is parsed by its Zod schema
- **THEN** parsing SHALL succeed without errors

#### Scenario: Schema rejects invalid data
- **WHEN** an object missing required fields is parsed by its Zod schema
- **THEN** parsing SHALL throw a ZodError

### Requirement: Barrel export with zero runtime
The `contracts/index.ts` file SHALL re-export all types using `export type *` syntax, ensuring zero runtime JavaScript is emitted for contract imports.

#### Scenario: Contracts barrel export is type-only
- **WHEN** `contracts/index.ts` is compiled
- **THEN** it SHALL emit no runtime JavaScript for type re-exports
