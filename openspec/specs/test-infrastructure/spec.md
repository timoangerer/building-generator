# test-infrastructure Specification

## Purpose
Generator test harness that runs any generator fixture across multiple seeds, validating schema conformance and behavioral invariants automatically.
## Requirements
### Requirement: Generic generator test factory
The system SHALL provide a `testGeneratorInvariants` function that accepts a generator function, Zod schema, config factory, and invariant table, and produces a full Vitest test suite including schema validation across multiple seeds and a determinism check. The function SHALL also accept a `GeneratorFixture` object directly (which contains the same fields), enabling test files to pass a shared fixture with a single call.

#### Scenario: Factory produces schema validation tests
- **WHEN** `testGeneratorInvariants` is called with a generator and schema
- **THEN** it SHALL create tests that validate the generator output against the schema for multiple seeds

#### Scenario: Factory produces determinism test
- **WHEN** `testGeneratorInvariants` is called
- **THEN** it SHALL create a test asserting that the same seed produces identical output

#### Scenario: Factory accepts GeneratorFixture directly
- **WHEN** `testGeneratorInvariants` is called with a `GeneratorFixture` object
- **THEN** it SHALL produce the same test suite as when called with individual options matching that fixture's fields

### Requirement: Geometry check helpers
The system SHALL provide reusable geometry check functions: `withinBounds` (checks if a point or element is within an AABB), `noOverlaps` (checks that a list of axis-aligned rectangles do not overlap), and `isFiniteCoord` (checks that all coordinates in a structure are finite numbers, no NaN or Infinity).

#### Scenario: withinBounds detects out-of-bounds
- **WHEN** `withinBounds` is called with a point outside the given AABB
- **THEN** it SHALL return false

#### Scenario: noOverlaps detects collision
- **WHEN** `noOverlaps` is called with two overlapping rectangles
- **THEN** it SHALL return false

#### Scenario: isFiniteCoord detects NaN
- **WHEN** `isFiniteCoord` is called with a structure containing NaN
- **THEN** it SHALL return false

### Requirement: Per-stub schema validation tests
Each stub generator SHALL have a test file that validates its output against the corresponding Zod schema using the generic test factory. Tests SHALL run with `npm run test`.

#### Scenario: All stub tests pass
- **WHEN** `npm run test` is executed
- **THEN** all stub generator schema validation tests SHALL pass

#### Scenario: Tests catch schema violations
- **WHEN** a stub generator output is modified to violate its schema
- **THEN** the corresponding test SHALL fail

### Requirement: Test files use shared fixtures
Each generator test file SHALL import its corresponding fixture from `@/test-fixtures` and pass it to `testGeneratorInvariants` in a single call. Test files SHALL NOT define inline configFactory, seeds, or invariants when a shared fixture exists.

#### Scenario: Test file is minimal
- **WHEN** a generator test file uses a shared fixture
- **THEN** the test file SHALL contain only the fixture import and a single `testGeneratorInvariants(fixture)` call (approximately 3 lines)

#### Scenario: All existing tests still pass
- **WHEN** test files are refactored to use shared fixtures
- **THEN** `npm test` SHALL pass with the same test count and assertions as before the refactor

