# CLAUDE.md

Read this first when working in this repo.

## Core Principles

- **Browser first, engine portable**: the browser is the primary product surface, but core generation logic must stay renderer-agnostic and emit engine-neutral data contracts.
- **Semantic before geometric**: think in `plot`, `facade`, `bay`, `floor`, `window`, `door` — not raw meshes or Three.js scene graph nodes.
- **Data-first generation**: every stage produces structured, inspectable, serializable outputs before anything becomes renderer state.
- **Deterministic by default**: every generator stage accepts explicit inputs and seeds. Same seed must produce same result.
- **Rules over one-offs**: a good facade rule describes a family of facades, not one exact wall.
- **AI-agent-friendly**: deterministic inputs, inspectable intermediates, explicit boundaries, verification that doesn't rely only on visual judgment.

## Documentation Index

| Document | Purpose |
|---|---|
| [`docs/product-vision.md`](docs/product-vision.md) | What the product is, north star, success criteria, non-goals |
| [`docs/architecture-principles.md`](docs/architecture-principles.md) | System shape, data contracts, module boundaries, codebase rules, browser workbench |
| [`docs/module-structure.md`](docs/module-structure.md) | Directory layout, dependency DAG, naming conventions, artifact store, test fixtures |
| [`docs/verification-strategy.md`](docs/verification-strategy.md) | How generators expose inspectable and testable outputs |
| [`docs/planning-workflow.md`](docs/planning-workflow.md) | Where durable docs end and OpenSpec change artifacts begin |
| [`docs/automated-linting.md`](docs/automated-linting.md) | Lint rules catalog, tooling, agent-teaching error messages, enforcement strategy |
| [`docs/why-web-not-game-engine.md`](docs/why-web-not-game-engine.md) | Why web/Three.js over game engines, tradeoffs, reversibility |
| [`docs/visual-style/`](docs/visual-style/) | Art direction, Three.js rendering guide, reference images, style vocabulary |

## Technology Stack

- TypeScript, Vite, React, Three.js
- ShadCN/ui + Tailwind for all non-3D UI (plain vanilla default theme, no custom styling)
- Leva for viewer/debug GUI controls
- Vitest for logic and contract tests
- Playwright for browser and screenshot verification

## Viewer / Debug UI Controls

Use **Leva** (`useControls` from `leva`) for all parameter controls in viewers and debug tools (2D canvas viewers, 3D scenes, lab tools). Do not build custom React+Tailwind control panels for this purpose. Reference: `src/facade-lab/viewer/main.tsx`. ShadCN/Tailwind remains the choice for app-level UI (navigation, sidebars, data display) — Leva is specifically for tweakable parameters in visual viewers.

## OpenSpec

- Use OpenSpec for planned and active implementation work.
- Change artifacts go under `openspec/changes/<change-name>/`.
- Stable accepted specs go under `openspec/specs/<capability>/spec.md`.
- Archived changes go under `openspec/changes/archive/YYYY-MM-DD-<change-name>/`.

## Generation Pipeline

```
plots -> massing -> facade decomposition -> element selection -> style assignment -> building assembly -> multi-building composition -> browser visualization
```

Each layer should be independently improvable while integrating through stable contracts.

## Linting

- Run `npm run lint` before committing.
- Violations include agent-teaching error messages — read and fix them.
- To add a new filesystem lint rule, create a file in `scripts/lint-rules/` exporting a `check()` function that returns `{ ok, messages[] }`.

## Verification Requirements

A generator change is not done when it only "looks correct" in the viewer. At minimum it must provide:

- deterministic inputs and seeds
- inspectable intermediate artifacts (JSON, structured output)
- at least one automated assertion on those artifacts
- a debugging path that explains failures

## MCP Tools

- **Library documentation**: use the **Context7 MCP server** (`mcp__context7__resolve-library-id` / `mcp__context7__query-docs`) to look up official, up-to-date documentation for any library (Three.js, Vite, Vitest, Playwright, etc.) before relying on training knowledge.
- **Live web inspection**: use either the **Playwright MCP** (`mcp__playwright__*`) or the **Chrome DevTools MCP** (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`) for any inspection of running web pages — DOM, network, console, screenshots, accessibility, performance.
