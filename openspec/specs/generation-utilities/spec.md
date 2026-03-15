# generation-utilities Specification

## Purpose
TBD - created by archiving change project-skeleton. Update Purpose after archive.
## Requirements
### Requirement: Seeded PRNG
The system SHALL provide a `createRng(seed: number): () => number` function that returns a deterministic pseudo-random number generator. Each call to the returned function SHALL produce a number in the range [0, 1). The same seed SHALL always produce the same sequence of values.

#### Scenario: Deterministic output
- **WHEN** `createRng(42)` is called twice and each generator is called 10 times
- **THEN** both sequences SHALL be identical

#### Scenario: Output range
- **WHEN** the RNG is called 1000 times
- **THEN** every value SHALL be >= 0 and < 1

### Requirement: Vec2 math operations
The system SHALL provide pure functions for Vec2 operations: `add`, `subtract`, `normalize`, `length`, `dot`, and `cross2D`. All functions SHALL accept and return `Vec2` values using the `{x, z}` convention.

#### Scenario: Vec2 add
- **WHEN** `add({x: 1, z: 2}, {x: 3, z: 4})` is called
- **THEN** the result SHALL be `{x: 4, z: 6}`

#### Scenario: Vec2 normalize produces unit length
- **WHEN** `normalize({x: 3, z: 4})` is called
- **THEN** the result SHALL have length 1.0 (within floating point tolerance)

#### Scenario: Vec2 cross2D
- **WHEN** `cross2D({x: 1, z: 0}, {x: 0, z: 1})` is called
- **THEN** the result SHALL be 1 (the 2D cross product scalar)

### Requirement: Wall-local to world coordinate conversion
The system SHALL provide a `wallLocalToWorld(wall: WallSegment, u: number, v: number): Vec3` function that converts wall-local coordinates (u along wall length, v up wall height) to world-space Vec3 positions.

#### Scenario: Wall origin maps to wall start at ground
- **WHEN** `wallLocalToWorld(wall, 0, 0)` is called
- **THEN** the result SHALL be the wall's start position at y=0

#### Scenario: Wall end maps correctly
- **WHEN** `wallLocalToWorld(wall, 1, 0)` is called with a wall of known start/end
- **THEN** the x and z coordinates SHALL match the wall's end position

