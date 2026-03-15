# city-pipeline-orchestrator Specification

## Purpose
TBD - created by archiving change project-skeleton. Update Purpose after archive.
## Requirements
### Requirement: End-to-end pipeline wiring
The orchestrator SHALL provide a `runCityPipeline(seed: number): SceneResult` function (or similar) that calls all generator stages in sequence: plots → massing → element catalog → facade → building assembly → scene composition. The output SHALL be a valid SceneResult.

#### Scenario: Pipeline produces valid SceneResult
- **WHEN** `runCityPipeline` is called with any seed
- **THEN** the output SHALL pass SceneResult Zod schema validation

#### Scenario: Pipeline is deterministic
- **WHEN** `runCityPipeline` is called twice with the same seed
- **THEN** both outputs SHALL be deeply equal

### Requirement: Pipeline respects dependency order
The orchestrator SHALL call generators in dependency order, passing each stage's output as input to the next. Generators SHALL NOT be called out of order or with missing inputs.

#### Scenario: Massing receives plot output
- **WHEN** the pipeline runs
- **THEN** the massing generator SHALL receive plot footprints from the plot generator's output

#### Scenario: Facade receives massing output
- **WHEN** the pipeline runs
- **THEN** the facade generator SHALL receive wall segments and floor info from the massing generator's output

