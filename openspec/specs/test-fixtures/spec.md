# test-fixtures Specification

## Purpose
Reusable test fixture factories for all generator stages, providing config factories, seed sets, Zod schema validation, and behavioral invariant checks.
## Requirements
### Requirement: GeneratorFixture type definition
The system SHALL provide a `GeneratorFixture<TConfig, TResult>` type in `src/test-fixtures/types.ts` that includes: `name` (display name), `stage` (routing key string), `generator` (function from TConfig to TResult), `schema` (Zod schema for TResult), `configFactory` (function from seed number to TConfig), `seeds` (array of canonical seed numbers), and `invariants` (array of `Invariant<TResult>` objects with `name` and `check` fields).

#### Scenario: Type is importable and usable
- **WHEN** a module imports `GeneratorFixture` from `@/test-fixtures`
- **THEN** it SHALL be able to declare a typed fixture object with all required fields

### Requirement: Invariant type definition
The system SHALL provide an `Invariant<T>` type in `src/test-fixtures/types.ts` with fields `name: string` and `check: (result: T) => boolean`.

#### Scenario: Invariant type enforces structure
- **WHEN** an invariant object is declared with the `Invariant` type
- **THEN** TypeScript SHALL enforce that `name` is a string and `check` is a function returning boolean

### Requirement: Per-stage fixture files
The system SHALL provide fixture files for each generator stage: `plot-fixtures.ts`, `massing-fixtures.ts`, `element-fixtures.ts`, `facade-fixtures.ts`, `building-fixtures.ts`, and `pipeline-fixtures.ts`. Each file SHALL export a `GeneratorFixture` instance containing the stage's generator function, Zod schema, configFactory, canonical seeds, and invariants extracted from the corresponding `.test.ts` file.

#### Scenario: Fixture includes all existing test invariants
- **WHEN** a fixture file is created for a generator stage
- **THEN** it SHALL contain all invariants previously defined inline in the corresponding `.test.ts` file

#### Scenario: Fixture seeds match existing test seeds
- **WHEN** a fixture file is created for a generator stage
- **THEN** it SHALL include the same canonical seeds as used in the existing test (defaulting to `[1, 42, 123, 999]`)

### Requirement: allFixtures registry
The system SHALL provide an `allFixtures` array in `src/test-fixtures/index.ts` that contains all per-stage fixture instances. The index file SHALL also re-export individual fixtures and all types.

#### Scenario: allFixtures contains all stages
- **WHEN** `allFixtures` is imported from `@/test-fixtures`
- **THEN** it SHALL contain fixture objects for plot, massing, element, facade, building, and pipeline stages

#### Scenario: Individual fixtures are importable
- **WHEN** a consumer imports a specific fixture (e.g., `facadeFixture`) from `@/test-fixtures`
- **THEN** it SHALL receive the typed `GeneratorFixture` for that stage

