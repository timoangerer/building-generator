# test-fixtures Specification

## Purpose
Reusable test fixture factories for all generator stages, providing config factories, seed sets, Zod schema validation, behavioral invariant checks, and optional descriptive labels.
## MODIFIED Requirements
### Requirement: GeneratorFixture type definition
The system SHALL provide a `GeneratorFixture<TConfig, TResult>` type in `src/test-fixtures/types.ts` that includes: `name` (display name), `stage` (routing key string), `generator` (function from TConfig to TResult), `schema` (Zod schema for TResult), `configFactory` (function from seed number to TConfig), `seeds` (array of canonical seed numbers), `invariants` (array of `Invariant<TResult>` objects with `name` and `check` fields), and optional `labels` (array of human-readable strings, one per seed).

#### Scenario: Type is importable and usable
- **WHEN** a module imports `GeneratorFixture` from `@/test-fixtures`
- **THEN** it SHALL be able to declare a typed fixture object with all required fields and the optional `labels` field

#### Scenario: Labels array length matches seeds
- **WHEN** a fixture provides a `labels` array
- **THEN** `labels.length` SHALL equal `seeds.length`, with `labels[i]` describing `seeds[i]`

### Requirement: Curated facade fixture seeds
The facade fixture SHALL use curated seeds `[1, 2, 3, 4, 5]` mapped to distinct wall configurations that showcase meaningful architectural variation. Each seed SHALL have a descriptive label.

#### Scenario: Seed 1 produces narrow 3-floor facade
- **WHEN** `configFactory(1)` is called on the facade fixture
- **THEN** the config SHALL specify an 8m-wide wall with 3 floors

#### Scenario: Seed 4 produces low wide facade
- **WHEN** `configFactory(4)` is called on the facade fixture
- **THEN** the config SHALL specify a 22m-wide wall with 2 floors

#### Scenario: Seed 5 produces party wall configuration
- **WHEN** `configFactory(5)` is called on the facade fixture
- **THEN** the config SHALL include at least one party wall alongside an exposed wall

#### Scenario: Unknown seeds use fallback config
- **WHEN** `configFactory` is called with a seed not in `[1, 2, 3, 4, 5]`
- **THEN** it SHALL return a default wall configuration rather than failing

## Unchanged Requirements
### Requirement: Invariant type definition
The system SHALL provide an `Invariant<T>` type in `src/test-fixtures/types.ts` with fields `name: string` and `check: (result: T) => boolean`.

### Requirement: Per-stage fixture files
The system SHALL provide fixture files for each generator stage: `plot-fixtures.ts`, `massing-fixtures.ts`, `element-fixtures.ts`, `facade-fixtures.ts`, `building-fixtures.ts`, and `pipeline-fixtures.ts`. Each file SHALL export a `GeneratorFixture` instance containing the stage's generator function, Zod schema, configFactory, canonical seeds, and invariants.

### Requirement: allFixtures registry
The system SHALL provide an `allFixtures` array in `src/test-fixtures/index.ts` that contains all per-stage fixture instances.
