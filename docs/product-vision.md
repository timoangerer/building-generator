# Procedural Building Generator Product Vision

Status: exploration draft

## Purpose

This project is a browser-first procedural building generator for stylized game environments.

The near-term goal is not photorealism and not a full city simulator. The goal is to build a clean, portable generation stack that can:

- generate plots
- extrude building massing from those plots
- decorate facades through reusable rule sets
- place architectural elements such as doors, windows, balconies, and ornaments
- scale from one facade to one building to many buildings
- run end-to-end in the browser

The long-term goal is to keep the core logic portable enough that the same conceptual system can later be moved into another game engine without redesigning everything from scratch.

## Project Context

This is a personal solo-developer project driven by interest in procedural architecture, stylized environments, and browser-first generation tools.

That means the product should optimize for:

- clear architecture
- fast iteration
- strong inspectability
- portable data contracts
- a workflow that stays understandable and maintainable without a large team

## Product Statement

We are building a modular procedural architecture system where semantic generation rules are kept separate from rendering details, asset sources, and engine-specific runtime code.

The product should feel like a stack of interoperable layers:

```text
plot generation
  -> building massing
    -> facade decomposition
      -> architectural element selection or generation
        -> material/styling assignment
          -> single-building assembly
            -> multi-building/city composition
              -> browser visualization, editing, testing, export
```

Each layer should be independently improvable, but they must also integrate through stable data contracts.

## Core Vision

The system should be good at producing buildings that look architecturally plausible in layout and rhythm, while staying visibly stylized and lightweight.

That means:

- realistic proportions, spacing, repetition, alignment, and hierarchy
- simplified geometry and materials
- reusable rules instead of hand-authored one-off facades
- clear separation between semantic intent and final mesh realization
- deterministic generation from seeds and explicit inputs

The visual target is "convincing as architecture" rather than "photorealistic as scanned reality."

## North Star Output

The near-term north star is not just an isolated building viewer. It is a small but convincing stylized environment that shows the whole stack working together.

The target scene is:

- a simple island-like presentation environment
- one central street running through the middle
- a handful of side alleys branching off that main road
- roughly 20 buildings arranged closely enough to read as a coherent urban slice
- enough variation that the buildings do not feel copy-pasted
- enough consistency that the scene still reads as one place rather than a random collection of facades

A good result should feel like a compact, believable street scene for a stylized game world: lightweight, readable, architecturally plausible, and generated through reusable rules rather than one-off manual composition.

## Design Principles

### 1. Browser First, Engine Portable

The browser implementation is the primary working product.

At the same time, the architecture should avoid browser-specific assumptions in the core generation logic. Core generation should ideally produce data that can be consumed by:

- a browser renderer
- a batch exporter
- a future game-engine adapter

### 2. Semantic Before Geometric

The system should reason in terms like:

- plot
- footprint
- facade
- bay
- floor
- opening
- door
- window
- balcony
- cornice
- roofline

It should not hardcode itself around specific mesh filenames, arbitrary scene hierarchies, or one renderer's transform conventions.

### 3. Reusable Rules, Adaptive Output

A facade rule set should work across multiple wall widths and heights. A good rule does not describe one exact wall. It describes how a family of walls should behave.

Examples:

- fit as many windows as sensible into a floor
- reserve a ground floor zone for doors and storefront-like openings
- adjust repetition counts based on available width
- preserve margins, rhythm, and proportions when dimensions vary

### 4. Layered Complexity

The system must support a very simple first version and a much richer future version without requiring a rewrite.

Example progression:

- start with downloaded or handmade placeholder assets
- apply a simple facade layout rule
- generate one building
- generate a street of buildings
- later introduce richer styles, corner logic, curved plots, roof systems, and element generators

### 5. AI-Agent-Friendly Development

The project should be structured so an AI coding agent can reliably implement, test, and verify small pieces of it.

This is especially important because 3D work is harder to validate than ordinary UI logic. The system should therefore expose intermediate outputs that are inspectable as structured data, 2D diagrams, or deterministic reference renders.

## What The Product Eventually Includes

Even if some of these arrive later, they should already shape the architecture.

### Generation Layers

- plot generator
- footprint and building envelope generator
- facade rule system
- architectural element library
- procedural architectural element generator
- material and style system
- roof and top-edge generation
- corner and transition handling
- multi-building street or block composer
- city-scale layout system

### Authoring and Tooling Layers

- browser workbench
- rule set editor
- seed and parameter inspector
- asset browser
- preview scenes
- export pipeline
- validation and testing tools

### Runtime and Portability Layers

- browser renderer
- engine-neutral core data model
- engine adapters later
- import/export formats for assets and generated building descriptions

## Functional Scope

### 1. Plot Generation

The system should be able to generate building plots or footprints that are suitable inputs for building creation.

Early capabilities:

- rectangle and simple orthogonal shapes
- size ranges
- seeded randomness
- simple constraints such as minimum frontage or depth

Later capabilities:

- L, U, H, O, and courtyard footprints
- irregular but valid polygonal plots
- zero-setback or edge-aligned plots
- setback rules
- adjacency-aware plots within a block
- street-facing logic
- district-specific distributions

The plot generator should output a normalized footprint description, not a renderer-specific mesh.

### 2. Building Massing and Extrusion

Given a plot, the system should extrude a building envelope.

Early capabilities:

- constant-height extrusion
- multiple floors with consistent floor heights
- optional ground floor differentiation
- simple roof cap

Later capabilities:

- stepped roofs
- parapets
- courtyards
- wing depth variation
- corner towers or special masses
- non-uniform heights by section

The massing stage should define:

- wall segments
- facade surfaces
- corners
- roof surfaces
- vertical extents

This stage is where a raw shape becomes a set of surfaces that later rules can target.

### 3. Facade Rule System

This is the core of the product.

The facade system should describe how a wall becomes architecture.

A facade rule should be reusable across many walls and should adapt sensibly to size changes. It should decide:

- vertical zoning
- floor repetition
- horizontal bay rhythm
- placement of doors, windows, balconies, and ornaments
- margins, spacing, and fallback behavior
- optional wall surface treatment and material hints

At minimum, the system should support the classic prototype case:

- a ground floor
- repeated upper floors
- regularly spaced windows
- a door at street level
- simple decorative separation between levels

Later, it should support:

- asymmetry where appropriate
- multiple window families in one facade
- corner treatments
- facade-specific exceptions
- storefronts
- attic floors
- balconies and projecting elements
- arches, lintels, pediments, sills, shutters
- interior courtyard facades
- curved or segmented walls

### Facade Rule Language Requirements

The rule language should be:

- semantic rather than mesh-specific
- deterministic when given the same seed
- expressive enough for both strict patterns and controlled variation
- constrained enough to remain testable

It should be able to express:

- zones with explicit or flexible heights
- rows or floor bands
- repeat-to-fit behavior
- min/max width and spacing constraints
- alignment rules
- ornament layers
- style parameters and asset-query hints

The facade stage should output a structured facade composition, not only triangles. That output should be inspectable and testable.

### 4. Architectural Element Library

The facade system should request semantic parts such as `window`, `door`, `balcony`, or `cornice`, not raw files.

This matches the existing direction described in [asset-library-architecture.md](/Users/timoangerer/conductor/workspaces/building-generator/berlin-v1/docs/asset-library-architecture.md).

The asset library is the bridge between semantic generation and actual visual assets. It should manage:

- normalized part records
- dimensions
- anchors
- style tags
- variant selection
- source traceability
- compatibility with placeholders early and real meshes later

The asset library should be able to start with manually selected assets and later grow into a richer catalog without changing the facade rule language.

### 5. Procedural Architectural Element Generator

This is a separate but related subsystem.

The facade system consumes architectural elements. The architectural element generator produces or parameterizes those elements.

Examples:

- rectangular windows with different muntin patterns
- arched windows
- doors with different proportions and paneling
- balconies with rail variations
- ornamental frames and trims

This subsystem may use:

- a subset of the facade language
- a separate shape grammar
- a parametric geometry tool
- template-driven mesh assembly

Its responsibilities are different from facade layout. It is about making or varying the building parts themselves.

Important requirement:

The output of this generator should be materializable and exportable, so generated elements can become reusable assets in the broader library.

### 6. Materials and Visual Style

The project should target a simple stylized visual language.

That means:

- clean forms
- readable silhouettes
- restrained material complexity
- lightweight geometry
- consistent proportions

The goal is not high-resolution realism.

Possible style directions later:

- simplified neoclassical
- European townhouse blocks
- colorful low-poly urban kits
- toy-city or board-game readability

The system should therefore separate:

- structural generation
- decorative detail generation
- material assignment

This will let the same underlying building logic support multiple surface styles later.

### 7. Building Assembly

A finished building should emerge from combining:

- a plot or footprint
- a massing definition
- facade assignments for each wall or wall segment
- selected or generated architectural elements
- style and material choices
- roof treatment

The building should be represented as both:

- a semantic building description
- a renderable assembled result

The semantic description matters because it is more portable, testable, and editable than final geometry alone.

### 8. Multi-Facade and Whole-Building Coherence

A major requirement is that facades should not be treated as isolated pictures.

The building system should eventually reason across multiple facades:

- street facade versus rear facade
- courtyard facade versus outer facade
- corner wrapping
- floor alignment across sides
- style coherence across the whole building
- different prominence levels for front, side, and back

This is important because plausible buildings often require one facade to inherit decisions from another.

Another important requirement is that buildings must be allowed to sit directly next to each other with no padding or perimeter path around the whole volume.

This should support common urban conditions such as:

- row buildings
- perimeter-block edges
- attached townhouses
- simple rectangular buildings sharing side boundaries

In those cases, the system should distinguish between:

- exposed facades that need visible architectural treatment
- shared or hidden party walls that may need little or no facade treatment

So a rectangular building might expose only two sides while the other two sides directly touch neighboring buildings.

### 9. Multi-Building and City Generation

The end goal is not a single hero facade. It is a generator that can create ensembles of buildings and eventually city-like compositions.

That larger-scale system should eventually handle:

- multiple plots
- street or block layouts
- district-level style distributions
- variation ranges
- height and frontage differences
- adjacency effects
- attached-building logic with shared boundaries
- repetition control
- landmark versus filler buildings

The city layer should compose lower-level systems, not replace them.

```text
city layout
  -> plots
    -> buildings
      -> facades
        -> elements
          -> meshes/materials
```

## Architectural Separation

The project should be explicitly divided into cooperating modules.

### Recommended Conceptual Modules

1. `core-geometry`
   Pure geometry helpers, footprint math, wall extraction, transforms.

2. `plot-generator`
   Produces valid plots or footprints from seeds and constraints.

3. `massing-generator`
   Converts plots into building envelopes and facade surfaces.

4. `facade-grammar`
   Converts wall surfaces plus style parameters into semantic facade compositions.

5. `asset-library`
   Resolves semantic requests into normalized parts.

6. `element-generator`
   Produces reusable parametric architectural components.

7. `building-assembler`
   Combines semantic descriptions and assets into renderable results.

8. `city-generator`
   Coordinates many plots and buildings into a larger composition.

9. `browser-workbench`
   Hosts visualization, editing, debugging, and exports.

These do not all need to exist immediately as folders or packages, but the conceptual boundaries should remain stable.

## Codebase Governance For AI-Agent Development

Because this project is intended to be implemented heavily by AI coding agents, architectural intent cannot live only in prose documentation. Wherever possible, the codebase should enforce structure automatically.

That means design rules should be encoded through tools such as:

- lint rules
- import and dependency boundary rules
- cycle detection
- restricted import policies
- directory or package boundary checks
- CI validation for architectural violations

### Governance Principle

If a separation rule is important, we should try to make it machine-checkable.

Markdown guidance is still useful for explanation, but the codebase should not rely on documentation alone to preserve architecture under frequent automated edits.

### What Should Be Enforced

Especially important areas for enforcement:

- allowed import directions between layers
- forbidden imports across subsystem boundaries
- prevention of circular dependencies
- clear ownership of shared utilities
- consistent placement of UI-only code versus core generation logic
- prevention of renderer-specific code leaking into portable generation modules
- restrictions on reaching into another module's internals instead of using public interfaces

### Why This Matters Here

This project has several layers that are easy to blur accidentally:

- core geometry
- massing and facade generation
- asset resolution
- browser-only viewer code
- scene assembly

Without automated checks, an AI agent can easily produce code that works locally but weakens the portability and separability that the whole project depends on.

### Desired Outcome

The codebase should guide contributors and agents toward the intended architecture by default.

In practice, that means:

- imports should reveal the intended dependency flow
- invalid cross-layer coupling should fail early
- reusable components should live in obvious shared locations
- module boundaries should be visible in both folder structure and automated checks

This is one of the main ways to keep the project scalable as many small agent-driven changes accumulate over time.

## Recommended Initial Technology Stack

The stack should stay modern, simple, browser-native, and easy for agents to reason about.

### Core Recommendation

- TypeScript for the application code
- Vite as the dev server and build tool
- React as the browser shell and UI composition layer
- `shadcn/ui` as the default component system for navigation, panels, and form-heavy tools
- Three.js as the 3D engine
- official Three.js addons for controls, loaders, helpers, and post-processing when needed
- `lil-gui` or an equally lightweight control panel for tweakable viewer parameters
- Vitest for fast unit and contract tests
- Playwright for browser-level end-to-end and visual verification
- ESLint plus dependency-boundary tooling for architectural enforcement

### Why This Stack

This combination matches the product goals well:

- browser-first
- minimal framework overhead
- fast live development
- good support for deterministic testing
- easy to isolate into focused viewers and tools
- compatible with the AI-agent-friendly verification strategy described elsewhere in this document

### Specific Guidance

#### Vite over a more experimental setup

Use Vite as the default dev server and build setup.

Reasoning:

- the repo already uses Vite today
- the Three.js manual explicitly documents a Vite-based installation path
- Vite keeps the development loop fast without forcing a larger framework choice
- Vitest pairs naturally with it because it reuses the same config and transform pipeline

For now, Bun is not necessary as a core project dependency. It can be revisited later if there is a strong workflow reason, but it should not complicate the baseline stack early.

#### React and shadcn as a thin shell around the 3D tools

Use React and `shadcn/ui` as the browser-facing shell, but keep that layer intentionally thin.

Reasoning:

- most of the product value is in the generation stack and 3D viewers
- React is useful for navigation, tool layout, panels, forms, and richer browser-side workflows
- `shadcn/ui` gives us an off-the-shelf design system without turning this into a custom frontend design project
- the desired UI is still tool-like rather than application-heavy
- the real architectural requirement is not "no framework", it is "keep the framework out of the core generation stack"

Practical rule:

The Three.js scenes, generation logic, data contracts, and renderer-facing modules should remain usable from outside React. React should orchestrate and host them, not own their internal logic.

#### Role split between shadcn and lil-gui

Use `shadcn/ui` for the application shell and any interface that is naturally panel-, form-, list-, or navigation-driven.

Use `lil-gui` only where a very local viewer-side tweaking surface is useful, for example:

- debug parameters for one scene
- temporary prototyping controls
- direct numeric tuning during visual iteration

This gives us a clean split:

- React plus `shadcn/ui` for structured browser tooling
- `lil-gui` for lightweight scene-local tweaking

Important constraint:

Use `shadcn/ui` mostly out of the box. Prefer its default design language, base styling, and standard component behavior instead of spending time on custom theming.

The goal would be:

- faster UI assembly
- a consistent visual language
- less bespoke frontend design work
- better support for tool-style panels and forms

This shell should remain a wrapper around the viewer tooling, not a reason to rewrite the core generation architecture.

#### Three.js plus official addons

Use the core `three` package and import addons explicitly as needed.

Likely early choices:

- `OrbitControls` for navigation
- `GLTFLoader` for asset loading
- helpers for debugging and scene inspection
- `EffectComposer` later if presentation polish becomes useful

#### Vitest for fast logic and contract testing

Use Vitest as the default test runner for:

- geometry helpers
- plot generation
- massing generation
- facade layout generation
- JSON contract snapshots
- invariants and deterministic seed tests

This should be the main testing layer because it fits the "structured outputs first" philosophy.

#### Playwright for browser and visual verification

Use Playwright for the cases where a real browser matters:

- viewer smoke tests
- loading tool routes
- deterministic screenshots
- overlay visibility checks
- end-to-end scene validation

This is especially useful for the facade-mask and screenshot-based verification strategy.

#### Storybook later, not now

Storybook is not needed in the first phase.

It may become useful later if the project accumulates many stable viewer scenarios or reusable UI panels that benefit from a catalog, but it should not be part of the initial stack.

## Portability Strategy

To stay portable to future engines, the system should preserve a split between:

- pure generation logic
- scene assembly logic
- renderer adapters

The preferred contract is:

```text
inputs + seed
  -> semantic model
    -> renderer-specific realization
```

Where possible, the semantic model should be serializable as JSON.

Examples of portable outputs:

- plot polygons
- building massing descriptions
- facade layout graphs
- asset placement instructions
- parameterized element definitions

If these outputs are stable, a future Unity, Unreal, Godot, or custom-engine adapter can consume them even if the browser renderer is replaced.

## AI-Agent-Friendly Verification Strategy

This is one of the most important requirements in the whole project.

3D generation is difficult to validate if the only output is a visual scene. The system should therefore expose multiple levels of verifiable output.

### Verification Principle

Every major generator should produce at least one output that is easy to inspect automatically.

### Recommended Verification Layers

1. Structured output verification

- JSON snapshots of plots, wall segments, facade zones, and placements
- schema validation
- invariants such as non-overlap, positive sizes, and valid counts

2. 2D projection verification

- facade layouts rendered as simple 2D diagrams
- orthographic masks
- color-coded occupancy maps
- letter-grid or tile-grid representations for windows, doors, and ornaments

3. Metrics verification

- counts of floors, bays, windows, doors, balconies
- width and height totals
- spacing and margin summaries
- symmetry or rhythm indicators where applicable

4. Visual regression verification

- deterministic seeded renders
- pixel comparisons with tolerances
- multiple camera presets

5. Debug overlay verification

- labels for zones
- outlines for placements
- anchors and bounds for assets

### Why This Matters

An AI agent can much more reliably satisfy and test requirements like:

- "the ground floor contains exactly one door"
- "windows do not overlap and stay within the facade bounds"
- "a repeat-fit row creates between 3 and 5 window instances at this width"

than vague visual instructions like:

- "it looks about right"

### Preferred Testable Artifacts

For each stage, prefer outputs such as:

- `plot.json`
- `massing.json`
- `facade-layout.json`
- `facade-mask.png`
- `placement-summary.json`

These are much easier to compare in CI or agent workflows than raw 3D scenes alone.

## Browser Product Surface

The browser app should eventually become a small workbench for procedural architecture.

The UI philosophy should stay simple and tool-oriented. This is closer to a developer power tool than a content-heavy consumer web app.

That implies:

- Three.js is the main viewing surface most of the time
- UI should mainly exist to inspect, tweak, and debug generation inputs and outputs
- controls should be lightweight and practical rather than heavily designed
- avoid unnecessary framework complexity in the browser shell
- prefer straightforward routes, panels, overlays, and inspectors over deep app structure

Useful views include:

- plot explorer
- massing viewer
- facade rule editor
- asset library browser
- element generator preview
- whole-building preview
- district or city preview
- debug overlays and test views

The browser product is not just a demo renderer. It is the primary development and inspection environment.

### Viewer and Tooling Approach

Each major subsystem should be visible in a dedicated web viewer so it can be inspected in isolation as well as in the full end-to-end scene.

Examples:

- a plot viewer
- a massing viewer
- a facade-layout viewer
- an asset preview viewer
- an element-generator viewer
- a whole-building viewer
- a multi-building scene viewer

These viewers should follow a common "power tool" pattern:

- one focused canvas
- a small set of live controls
- debug overlays
- seeded regeneration
- quick visibility into structured outputs when needed

### Development Workflow Preference

The development workflow should make it easy to open and work on each tool individually.

Preferred characteristics:

- each viewer or tool can be launched directly during development
- each tool has a live dev-server workflow
- it is easy to isolate one subsystem without navigating a large application shell
- shared infrastructure should exist, but the individual tools should remain easy to open and reason about

In practice, this likely means separate routes, dedicated workbench entries, or similarly direct entry points for each viewer.

## Presentation Environment

To make the early end-to-end prototype feel like a real product, generated buildings should be shown inside a simple but deliberate world context rather than floating in an empty scene.

The recommended first presentation environment is:

- a standard Three.js world
- a small square or rectangular buildable area such as `50 x 50` or `100 x 100`
- a small island or land platform
- surrounding water
- sky and lighting
- no dependency on dense backdrop props or heavy scene dressing

This environment should be mostly static and fixed. Its role is to frame the generated buildings, make screenshots and demos more compelling, and let us judge scale, spacing, and silhouette in context.

The point of this slice is partly emotional as well as technical: it helps us quickly see the whole system playing together and makes it easier to stay motivated while the deeper generation systems are still rough.

Important constraint:

The presentation environment should remain separate from the procedural building stack. It is a hosting scene, not part of the core generation logic.

That means we should be able to swap the environment later for alternatives such as:

- forest clearing
- desert outpost
- cliffside plateau
- stylized urban ground plane

without changing the plot, massing, facade, or asset contracts.

## Iteration Strategy

The right way to build this is from end-to-end simplicity first, not subsystem perfection in isolation.

### Recommended Development Path

1. Generate a simple plot.
2. Extrude a simple building.
3. Apply one simple facade rule.
4. Use a tiny initial asset set, even if manually authored or downloaded.
5. Place several buildings into a small presentation environment, ideally a simple island scene surrounded by water and sky.
6. Render the full composition in the browser.
7. Scale the composition and improve each subsystem independently while preserving the same contracts.

This gives us an end-to-end loop early, which is far more valuable than overbuilding the facade grammar or asset generator before they are integrated.

## Near-Term Product Slice

The first meaningful slice of the product should likely include:

- seeded plot generation with a few orthogonal footprint types
- extrusion into a clean building mass
- a simple facade grammar with floors, windows, and a ground-floor door
- a minimal semantic asset library
- placeholder architectural meshes or primitive proxies
- browser visualization of multiple buildings inside a simple island environment
- deterministic debug output for verification

If this works, the project already proves the central thesis.

## Later Expansion Areas

These should influence design now even if implementation comes much later.

- richer roof generation
- corner logic and junction handling
- balconies, storefronts, arcades, shutters
- style families and district presets
- procedural asset generation for windows and doors
- curved or non-orthogonal facades
- street-aware and block-aware city generation
- export of semantic building definitions
- export of generated asset kits
- engine adapters beyond the browser
- level-of-detail strategies
- performance-aware instancing
- authoring tools for human-guided overrides

## Data and Contract Philosophy

The project should treat generated buildings as data first.

That means:

- explicit seeds
- explicit parameters
- explicit semantic outputs
- explicit asset resolution results
- explicit style tags

Avoid burying critical logic only inside scene graph side effects.

A building that cannot be described as structured data will be much harder to:

- test
- export
- debug
- port
- edit
- regenerate deterministically

## Creative Constraints

To keep the product focused, we should be clear about what it is not trying to do right now.

### Non-goals for now

- photorealistic rendering
- ultra-detailed bespoke ornament modeling
- full interior generation
- structural engineering realism
- large-scale traffic or population simulation
- arbitrary freeform architecture styles all at once

This project is about procedural building composition and architecture logic, not about simulating every aspect of a city.

## Product Success Criteria

The project is succeeding if, over time, it can demonstrate all of the following:

- a single seed produces deterministic results
- simple rules create plausible facade layouts across varying dimensions
- semantic asset queries can map onto interchangeable visual kits
- buildings can be generated end-to-end in the browser
- the outputs are inspectable and testable without manual visual judgment alone
- the same concepts could realistically be moved into another runtime later
- multiple buildings together start to read as a coherent urban ensemble

## Key Open Questions

These are not blockers for drafting the architecture, but they should remain visible.

1. How expressive should the facade rule language become before it turns into an untestable mini-programming language?
2. Should the architectural element generator share the same rule language, or should it use a smaller dedicated parametric system?
3. How should corner conditions inherit or override facade rules?
4. What is the minimal semantic building format that is both renderer-friendly and engine-portable?
5. How do we want style families to be authored: presets, tags, weighted rules, or explicit kits?
6. Which debug representations are most useful for agent verification: JSON, 2D masks, letter grids, or reference renders?
7. At city scale, should variation come mostly from plot diversity, facade presets, element diversity, or district-level constraints?

## Suggested Future Document Split

This document should remain the top-level anchor. As the project grows, it can be split into more focused companion documents such as:

- product scope and roadmap
- domain model and portable data contracts
- facade grammar design
- architectural element generator design
- asset library and kit normalization
- browser workbench and authoring tools
- verification and testing strategy
- city-generation strategy

That would preserve one central vision document while letting implementation details deepen in separate files.

## Working Thesis

The strongest version of this project is not "a browser demo that makes some buildings."

It is a layered procedural architecture platform where:

- semantic rules define architectural intent
- assets and generated elements realize that intent visually
- browser tools make the system inspectable and editable
- structured outputs make it verifiable by AI agents
- stable data contracts make it portable to future runtimes

That is the direction this document should anchor.
