# pipeline-contracts Delta Spec

## MODIFIED Requirements

### Requirement: Facade contract types
The system SHALL define `FacadeConfig`, `ElementPlacement`, `WallFacade`, and `FacadeResult` types. `FacadeConfig` SHALL include `seed`, `walls`, `floors`, `availableElements`, `bayWidth`, and `edgeMargin`. `ElementPlacement` SHALL include `elementId`, `position` (Vec3), `rotationY`, and an optional `scale` (Vec3) defaulting to `{x:1, y:1, z:1}` when absent. `WallFacade` SHALL include `buildingId`, `wallIndex`, `placements`, and an optional `bayGrid` array of `{ floorIndex: number; bayIndex: number; elementId: string }` entries for inspection.

#### Scenario: FacadeResult contains wall facades
- **WHEN** a FacadeResult is validated
- **THEN** it SHALL contain a `config` and an array of `facades`, each with `buildingId`, `wallIndex`, and `placements`

#### Scenario: ElementPlacement scale is optional
- **WHEN** an ElementPlacement without a `scale` field is validated
- **THEN** validation SHALL succeed and the placement SHALL be treated as having scale `{x:1, y:1, z:1}`

#### Scenario: ElementPlacement with scale is valid
- **WHEN** an ElementPlacement with `scale: { x: 1.2, y: 1.2, z: 1.2 }` is validated
- **THEN** validation SHALL succeed

#### Scenario: WallFacade bayGrid is optional
- **WHEN** a WallFacade without a `bayGrid` field is validated
- **THEN** validation SHALL succeed

#### Scenario: WallFacade with bayGrid is valid
- **WHEN** a WallFacade with `bayGrid: [{ floorIndex: 0, bayIndex: 0, elementId: "window-tall" }]` is validated
- **THEN** validation SHALL succeed and each entry SHALL have `floorIndex`, `bayIndex`, and `elementId`
