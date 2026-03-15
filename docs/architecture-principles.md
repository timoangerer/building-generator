# Architecture Principles

Status: durable reference

## System Shape

The desired generation flow is:

```text
plots
  -> massing
    -> facade decomposition
      -> semantic element selection or generation
        -> material and style assignment
          -> building assembly
            -> multi-building composition
              -> browser visualization and export
```

Each layer should be independently improvable while integrating through stable contracts.

## Core Contract

The preferred contract is:

```text
inputs + seed
  -> semantic model
    -> renderer-specific realization
```

Key rule: generation logic should produce structured semantic outputs before anything becomes Three.js scene graph state.

Portable outputs should include artifacts such as:

- plot polygons
- building massing descriptions
- facade layout graphs
- asset placement instructions
- parameterized element definitions

## Architectural Principles

### Browser first, not browser locked

The browser is the primary workbench, but the core generation stack should avoid renderer-specific assumptions.

### Semantic before mesh-specific

Generation should request semantic parts such as `window`, `door`, and `cornice`. Asset resolution and rendering happen downstream.

### Deterministic by default

Every generator stage should accept explicit inputs and seeds. Regeneration should be stable.

### Layered complexity

The system should support a simple first version and richer future versions without a rewrite. Placeholder assets, simple rules, and minimal scenes are valid first-class steps.

### Whole-building thinking

Facades are not isolated images. The system should eventually reason about:

- front, rear, side, and courtyard facades
- corner conditions
- floor alignment across sides
- attached-building conditions and party walls

## Module Boundaries

See `docs/module-structure.md` for the concrete directory layout, dependency DAG, naming conventions, artifact store, and extraction rules.

The short version: `contracts/` and `utils/` at the bottom, `generators/` in the middle (never importing each other), `orchestrator/` wiring them together, `workbench/` on top owning all browser and Three.js concerns.

## Codebase Rules For Agents

If a boundary matters, it should be machine-checkable rather than documented only in prose.

Important enforcement targets:

- allowed import direction between layers (see `docs/module-structure.md` for the full DAG)
- prevention of circular dependencies
- separation of browser-only code from portable generation code
- restrictions on reaching into another module's internals (use `index.ts` public APIs)
- obvious ownership for shared utilities

The project should bias toward CI checks, lint rules, and dependency-boundary tooling over informal conventions.

## Browser Workbench

The browser app is not just a demo renderer. It is the main inspection and authoring surface.

Useful dedicated viewers include:

- plot viewer
- massing viewer
- facade-layout viewer
- asset preview viewer
- element-generator viewer
- whole-building viewer
- multi-building scene viewer

Each viewer should favor:

- one focused canvas
- a small control surface
- deterministic seeded regeneration
- debug overlays
- quick access to structured outputs

## Presentation Environment

The initial end-to-end presentation should use a small, mostly fixed world context. A simple island-like environment is a good default because it frames generated buildings without becoming its own subsystem.

Important rule: the hosting environment is separate from the procedural building stack. It should be replaceable without changing plot, massing, facade, or asset contracts.

## Technology Direction

The stack is:

- TypeScript for application code
- Vite for dev/build
- React as the thin application shell (hosts panels, controls, layout — does not own generation logic)
- Three.js for rendering (embedded via R3F or imperative refs, not driving app structure)
- ShadCN/ui + Tailwind for all non-3D UI
- Vitest for fast logic and contract tests
- Playwright for browser and screenshot verification

React and ShadCN are included from the start so that every panel, sidebar, and control surface is built with a consistent component library from day one. The React shell hosts the tooling surface; core generation logic remains framework-agnostic.

## UI Design Guidelines

All non-3D UI (panels, sidebars, controls, inspectors, toolbars) must follow these rules:

**Style: plain vanilla ShadCN internal-tool aesthetic.**

- Use ShadCN/ui components as-is with their default theme. No custom color palettes, no branded styling, no decorative flourishes.
- Dark mode by default (neutral grays). Light mode support is not required initially.
- Typography: use the ShadCN/Tailwind default sans-serif stack. No custom fonts.
- Spacing and sizing: stick to Tailwind's default scale. Dense but readable — this is an internal workbench, not a marketing page.
- Icons: Lucide (ShadCN's default icon set). No other icon libraries.
- No gradients, no shadows beyond ShadCN defaults, no rounded-xl hero cards, no glassmorphism, no animated backgrounds.

**Layout principles:**

- Resizable panels (sidebar + canvas + optional inspector) using ShadCN's `ResizablePanelGroup`.
- Controls that affect generation (seed, parameters) go in a sidebar or panel, not floating over the canvas.
- Structured data viewers (JSON trees, tables) use ShadCN `Table`, `Accordion`, or `ScrollArea` — not custom components.
- Toasts and dialogs use ShadCN primitives.

**What to avoid:**

- Custom CSS beyond Tailwind utilities and ShadCN component overrides.
- Fancy colored themes, neon accents, or "dark hacker" aesthetics.
- Design that draws attention to itself. The UI should disappear — the 3D canvas and generated data are the focus.
