## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Test files use shared fixtures
Each generator test file SHALL import its corresponding fixture from `@/test-fixtures` and pass it to `testGeneratorInvariants` in a single call. Test files SHALL NOT define inline configFactory, seeds, or invariants when a shared fixture exists.

#### Scenario: Test file is minimal
- **WHEN** a generator test file uses a shared fixture
- **THEN** the test file SHALL contain only the fixture import and a single `testGeneratorInvariants(fixture)` call (approximately 3 lines)

#### Scenario: All existing tests still pass
- **WHEN** test files are refactored to use shared fixtures
- **THEN** `npm test` SHALL pass with the same test count and assertions as before the refactor
