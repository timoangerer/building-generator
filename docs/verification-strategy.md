# Verification Strategy

Status: durable reference

## Purpose

This project must be verifiable by AI agents end-to-end — both writing tests and writing implementations. No step in the verification workflow should require a human in the loop. An agent should be able to read the contracts, generate tests, implement the code, and confirm it passes — all autonomously.

Primary rules:

- every major generator stage must emit at least one artifact that is easy to inspect automatically
- tests should be declarative and data-driven, not walls of imperative assertion code
- verification must survive rapid schema evolution during prototyping

## Verification Principles

- prefer structured outputs over scene-only validation
- keep seeds explicit and deterministic
- verify invariants early, before render output
- use visual tests as a later layer, not the only layer
- expose debug overlays and intermediate data for inspection
- minimize test lines of code — parameterize, don't copy-paste
- tests should be resilient to contract changes — derive from schemas, not hardcoded shapes

## Testing Pyramid

```
                    ╭─────────────────────╮
                    │  Visual regression   │  ← Playwright screenshots, few, slow
                    ╰─────────────────────╯
                ╭─────────────────────────────╮
                │  Integration / pipeline      │  ← Orchestrator wiring, ~10 tests
                ╰─────────────────────────────╯
            ╭─────────────────────────────────────╮
            │  Property-based invariant tests       │  ← Per generator, many seeds
            ╰─────────────────────────────────────╯
        ╭─────────────────────────────────────────────╮
        │  Contract / schema validation tests          │  ← Every stage output
        ╰─────────────────────────────────────────────╯
    ╭─────────────────────────────────────────────────────╮
    │  Unit tests for utils, math, geometry helpers        │  ← Fast, deterministic
    ╰─────────────────────────────────────────────────────╯
```

**Bottom (utils/math):** Classic unit tests. `offsetPolygon()` with known inputs, expected outputs.

**Contract/schema:** Zod schemas mirroring contract types. Generator outputs validated against schemas automatically. When a contract type changes, the schema changes, and validation tests update with it — no separate assertion code to maintain.

**Property-based invariants:** The core of generator verification. Assert invariants that hold across any valid output, for any seed. Uses fast-check to generate random valid configs.

**Integration:** Run the orchestrator pipeline end-to-end with fixed seeds. Assert the full chain composes correctly.

**Visual regression:** Playwright renders a seeded scene at a fixed camera, compares against a golden screenshot with tolerance. Last safety net, not primary verification.

## Keeping Tests Small And Resilient

During prototyping, contracts and schemas will change frequently. Test code must not become a maintenance burden that slows iteration.

### Schema-driven validation (zero manual assertions)

Every contract type should have a co-located Zod schema. A generic test helper validates any generator output against its schema automatically:

```ts
// shared test helper — one function, covers all stages
function assertValidOutput<T>(schema: ZodSchema<T>, output: unknown): T {
  return schema.parse(output); // throws with detailed errors on failure
}
```

When the contract changes, update the Zod schema. The validation tests don't need any code changes — they just call the same helper.

### Declarative invariant tables

Instead of writing imperative test code per generator, define invariants as data. The test runner consumes the table:

```ts
// invariants defined as data, not as test code
const FACADE_INVARIANTS: Invariant<FacadeResult>[] = [
  { name: "windows within bay bounds", check: (r) => r.bays.every(b => b.elements.every(e => withinBounds(e, b.bounds))) },
  { name: "ground floor has door",     check: (r) => r.floors[0].elements.some(e => e.type === "door") },
  { name: "no element overlap",        check: (r) => noOverlaps(r.floors.flatMap(f => f.elements)) },
];
```

A single parameterized test runner executes all invariants across all seeds:

```ts
describe("facade generator invariants", () => {
  const seeds = Array.from({ length: 50 }, (_, i) => i);

  FACADE_INVARIANTS.forEach(({ name, check }) => {
    test.each(seeds)(`${name} (seed %i)`, (seed) => {
      const result = generateFacade(makeConfig(seed));
      expect(check(result)).toBe(true);
    });
  });
});
```

Adding a new invariant is one line in the table. Testing 50 more seeds is changing one number. No test code duplication.

### Vitest parameterized patterns to use

- **`test.each`** for seed sweeps and fixture matrices
- **`describe.each`** for running the same invariant suite across multiple generator stages
- **`test.for`** (Vitest 2.x) for parameterized async tests
- **Shared test factories** that take a generator function and invariant table, returning a full test suite — one factory covers every generator stage

### Template: generic generator test factory

```ts
// One factory, reused for every generator stage
function testGeneratorInvariants<C, R>(
  name: string,
  generate: (config: C) => R,
  schema: ZodSchema<R>,
  makeConfig: (seed: number) => C,
  invariants: Invariant<R>[],
  seedCount = 50,
) {
  describe(name, () => {
    const seeds = Array.from({ length: seedCount }, (_, i) => i);

    test.each(seeds)("schema valid (seed %i)", (seed) => {
      const result = generate(makeConfig(seed));
      expect(() => schema.parse(result)).not.toThrow();
    });

    invariants.forEach(({ name: invName, check }) => {
      test.each(seeds)(`${invName} (seed %i)`, (seed) => {
        const result = generate(makeConfig(seed));
        expect(check(result)).toBe(true);
      });
    });

    test("deterministic across runs", () => {
      const a = generate(makeConfig(42));
      const b = generate(makeConfig(42));
      expect(a).toEqual(b);
    });
  });
}
```

Adding a new generator stage to the test suite = one call to `testGeneratorInvariants` with the stage's schema and invariant table. Total new test code: ~10-20 lines.

## Agentic TDD Workflow

The full test-then-implement cycle should be executable by agents without human involvement.

### Protocol for implementing a generator stage

1. **Agent reads the contract types** (`{Stage}Config`, `{Stage}Result` from `contracts/`)
2. **Agent writes or updates the Zod schema** co-located with the contract types
3. **Agent writes the invariant table** — declarative list of properties that must hold
4. **Agent writes `makeConfig` helper** — produces valid random configs for a given seed
5. **Agent calls `testGeneratorInvariants`** — the generic factory does the rest
6. **Agent runs the tests** — they fail (no implementation yet)
7. **Agent implements the generator** to make all tests pass
8. **Agent runs the tests again** — all green means done

Steps 2-5 produce ~20-40 lines of declarative code. The generic factory and helpers are shared infrastructure written once.

### What makes this agent-friendly

- **No ambiguity about "done."** Tests pass or they don't.
- **No visual judgment required.** All assertions are structural and numeric.
- **Invariant tables are readable requirements.** An agent can inspect the table to understand what the generator must satisfy.
- **Schema changes propagate automatically.** Update the Zod schema → existing validation tests catch regressions without code changes.
- **Seed sweeps catch edge cases.** No need for an agent to imagine tricky inputs — property-based testing and seed sweeps do that automatically.

### What an agent should NOT do

- Write large imperative test files with hardcoded expected outputs
- Assert exact coordinate values (fragile, breaks on any algorithm tweak)
- Skip the test-first step and write tests after implementation (defeats the purpose)
- Write tests that only work for one specific seed

## Verifying 2D And 3D Generation Outputs

Procedural geometry is hard to test. The strategy is to avoid testing geometry directly wherever possible, and to use lightweight structural checks where geometry testing is unavoidable.

### Strategy: structural before visual

Most "3D verification" should actually be **structured data verification** on the semantic output that drives the 3D. The architecture already mandates that every stage produces structured output before rendering. That structured output is the primary test surface.

### Structured data checks (covers ~80% of needs)

These operate on the JSON/typed output, not on any rendered result:

- **Bounds checking:** every placed element fits within its parent container
- **Non-overlap:** no two elements in the same plane intersect
- **Count assertions:** floor count, bay count, door count within expected ranges
- **Adjacency and connectivity:** floors are contiguous, bays tile without gaps
- **Dimensional consistency:** segment widths sum to total width (within tolerance)
- **Determinism:** same seed produces identical output

### 2D projection checks

For facade-related stages, project 3D placements into 2D and verify:

- **Occupancy grids:** rasterize placements onto a pixel grid, check coverage ratios
- **Row/column alignment:** windows on the same floor share y-coordinates within tolerance
- **Symmetry verification:** if a rule claims bilateral symmetry, verify it mathematically on the 2D projection
- **Silhouette checks:** the building outline from a given direction matches expected proportions

These are pure numeric operations — no rendering pipeline involved.

### Metric extraction and range assertions

Extract summary metrics and assert they fall within valid ranges:

- `glazingRatio` between configurable min and max
- `groundFloorDoorCount >= 1`
- `windowsPerFloor` within expected range for building width
- `totalElementArea / facadeArea` (coverage ratio)
- `floorHeights` monotonically increasing

Metrics are cheap to compute, easy to parameterize, and resilient to implementation changes. They are the most cost-effective verification layer for generators.

### Bounding volume checks

A generic invariant that applies to every stage:

- every placed element has positive, finite dimensions
- every element fits within its parent's bounding volume
- no element protrudes beyond the building envelope
- no NaN or Infinity values in any coordinate

This is a single reusable invariant function, not per-stage test code.

### Visual regression (last layer, few tests)

- Fixed camera presets per viewer (front ortho, 3/4 perspective, top-down)
- Seeded generation → deterministic Playwright screenshot
- Pixel comparison with configurable tolerance (e.g., 0.1% pixel diff)
- **Keep these tests few and separate from logic tests.** They break on any rendering change (materials, lighting, antialiasing) and are slow to run.
- **Never use visual regression as the primary verification** for a generator change.

### What NOT to try to automate

- Aesthetic quality (does it "look good"?)
- Proportional harmony (does the facade feel balanced?)
- Stylistic coherence (do these buildings feel like they belong together?)

These are tuned by adjusting generation rules and parameters, not by testing pixels. Automated tests ensure the output is *valid*; human review during rule-tuning ensures it is *good*. Debug overlays and the browser workbench serve this purpose.

## Required Verification Layers

### 1. Structured output verification

Examples:

- `plot.json`
- `massing.json`
- `facade-layout.json`
- `placement-summary.json`

Handled automatically by Zod schema validation and invariant tables.

### 2. 2D projection verification

Examples:

- facade occupancy grids
- orthographic silhouettes
- alignment heatmaps

Pure numeric operations on structured output. No renderer needed.

### 3. Metrics verification

Examples:

- floor counts, bay counts, door and window counts
- margin and spacing summaries
- width and height totals, coverage ratios

Expressed as range assertions in invariant tables.

### 4. Visual regression verification

Examples:

- deterministic seeded screenshots
- fixed camera presets
- tolerant pixel comparisons

Few tests, run separately, used for regression detection only.

### 5. Debug overlay verification

Examples:

- zone labels, asset bounds, anchors, placement outlines

Debug overlays make failures legible to both humans and agents during development. They are not automated test targets — they are diagnostic tools.

## Expectations By Generator Stage

### Plot generation

Should expose structured footprint output and validity checks. Invariants: valid polygons, positive areas, non-overlapping plots, plots within site bounds.

### Massing generation

Should expose wall segments, facade surfaces, corners, roof surfaces, and floor heights. Invariants: floors stack correctly, wall segments form closed perimeters, heights are positive.

### Facade generation

Should expose semantic composition, zoning, bay rhythm, placements, and fallback decisions. Invariants: elements within bays, no overlaps, ground floor access, coverage ratios in range.

### Asset resolution

Should expose which semantic request mapped to which asset or generated element, with dimensions and anchors. Invariants: every request resolved, dimensions positive, anchors within element bounds.

### Building assembly

Should preserve a semantic building description even after creating renderable output. Invariants: semantic model round-trips, element count matches pre-assembly count.

## Definition Of Done For A Generator Change

A change is not done when it only "looks correct" in the viewer.

At minimum, a generator-facing change must provide:

- deterministic inputs and seeds
- updated Zod schema if contracts changed
- invariant table covering the new behavior
- all seed-sweep tests passing
- a debugging path that explains failures

## Tooling

| Concern | Tool | Notes |
|---|---|---|
| Unit + contract tests | Vitest | Primary test runner |
| Property-based testing | fast-check + Vitest | Random valid inputs, invariant assertions |
| Schema validation | Zod | Co-located with contract types, drives validation tests |
| Parameterized tests | Vitest `test.each` / `describe.each` | Seed sweeps, fixture matrices |
| Visual regression | Playwright + screenshot comparison | Few tests, run separately |
| Geometry helpers | Shared `test-utils/` | `withinBounds`, `noOverlaps`, `isFiniteCoord`, etc. |

## File Organization

```
src/
├── contracts/
│   ├── plot.ts              # TypeScript types
│   ├── plot.schema.ts       # Zod schema, co-located
│   └── ...
├── test-utils/
│   ├── generator-test-factory.ts   # generic testGeneratorInvariants
│   ├── geometry-checks.ts          # withinBounds, noOverlaps, etc.
│   └── index.ts
├── generators/
│   ├── plot/
│   │   ├── plot-generator.ts
│   │   ├── plot-generator.test.ts  # ~20 lines: invariant table + factory call
│   │   └── index.ts
│   └── ...
```

Test files for generators should be short — an invariant table and a call to the generic factory. The shared infrastructure in `test-utils/` does the heavy lifting.
