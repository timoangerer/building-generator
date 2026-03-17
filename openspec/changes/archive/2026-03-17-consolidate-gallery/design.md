## Context

The building generator workbench has grown to include four separate viewer entry points (gallery, env-lab, facade-lab, plot-lab) plus the main workbench. Each has its own HTML file, React bootstrap, and Vite config entry. Rendering code is split across `src/rendering/`, `src/gallery/renderers/`, `src/facade-lab/renderer/`, and `src/env-lab/viewer/`. UI components, hooks, and utilities are in `src/components/ui/`, `src/hooks/`, and `src/lib/` respectively.

The gallery already renders all pipeline stages. The env-lab already has a working scene and layer system. The facade-lab's rendering logic is already reused by the gallery. The plot-lab's canvas was already moved to a gallery renderer. These tools share infrastructure but are deployed as separate apps.

## Goals / Non-Goals

**Goals:**
- Single workbench entry point that hosts all viewers (fixture stages + environment tool)
- Consolidated `src/viewers/` module for all rendering code with clean sub-module structure
- Unified `src/ui/` directory for ShadCN components, hooks, and utilities
- Simplified lint rule configuration (one directory instead of five)
- Clean barrel exports from `src/viewers/` so the workbench can import everything it needs

**Non-Goals:**
- New rendering features or visual changes
- Changing the generator pipeline or contracts
- Rebuilding the env-lab controls or layer system
- Mobile/responsive layout
- Adding new test infrastructure

## Decisions

### 1. Three-level viewers directory structure

```
src/viewers/
├── shared/       — Three.js setup, geometry utils, StageRenderer/ToolRenderer types
├── stages/       — per-stage renderers + registry factory
└── environment/  — env scene, layers, presets, controls, env renderer
```

`shared/` holds infrastructure that any viewer might need. `stages/` holds the per-pipeline-stage renderers used by the workbench fixture sections. `environment/` holds the complete env-lab as a self-contained sub-module. This mirrors the domain: stages are pipeline outputs, environment is a separate visual tool.

Alternative considered: flat `src/viewers/` with all files at one level. Rejected because 20+ files without grouping makes navigation difficult.

### 2. ToolRenderer interface for non-fixture viewers

Introduce `ToolRenderer` alongside `StageRenderer<T>`:

```typescript
type ToolRenderer = {
  mount(container: HTMLElement): Promise<void>;
  dispose(): void;
};
```

Unlike `StageRenderer`, a `ToolRenderer` doesn't receive a typed result — it manages its own data (e.g., the env scene creates its own layers). The `mount` is async because the env scene initializes WebGPU resources.

The workbench shell handles both renderer types via a discriminated union selection model (`kind: "fixture" | "tool"`).

### 3. EnvRendererHandle extends ToolRenderer with getApi()

The environment renderer needs to expose its `EnvSceneApi` so the workbench can render `EnvLabControls`. Rather than making the workbench reach into environment internals, the env renderer extends `ToolRenderer` with a `getApi()` accessor:

```typescript
type EnvRendererHandle = ToolRenderer & { getApi(): EnvSceneApi | null };
```

The workbench checks for `getApi` via duck-typing after mount, keeping the `ToolRenderer` interface generic.

### 4. WorkbenchSection discriminated union

The workbench sidebar renders both fixture sections (from `allFixtures`) and tool sections (environment presets). These are modeled as a discriminated union:

```typescript
type FixtureSection = { kind: "fixture"; stage: string; fixture: GeneratorFixture };
type ToolSection = { kind: "tool"; id: string; label: string; items: { id: string; label: string }[] };
type WorkbenchSection = FixtureSection | ToolSection;
```

This keeps the sidebar rendering generic while allowing different selection behaviors for fixtures (run generator + mount stage renderer) vs tools (mount tool renderer).

### 5. UI module at src/ui/

Move all ShadCN components, hooks, and utilities under `src/ui/`:

```
src/ui/
├── components/   — ShadCN component files (button, dialog, sidebar, etc.)
├── hooks/        — use-mobile.ts
└── lib/          — utils.ts (cn helper)
```

This mirrors the convention of grouping non-domain UI infrastructure together. The `components.json` config is updated to point ShadCN CLI at `src/ui/components/`.

### 6. Single Vite entry point

Remove all secondary entry points from `vite.config.ts`. The workbench (`src/workbench/index.html`) is the only entry. This eliminates the need for separate `dev:*` scripts and simplifies the build.

The trade-off is that individual labs can no longer be opened in isolation. In practice, the workbench's sidebar navigation provides equivalent access with less context-switching.

### 7. Lint rule simplification

Replace `["gallery", "env-lab", "facade-lab", "plot-lab", "rendering"]` entries in both lint rules with a single `"viewers"` entry. The `workbench` entry is removed from `no-three-outside-rendering` since the workbench itself no longer imports Three.js directly — it delegates to `src/viewers/`.

## Risks / Trade-offs

- **Loss of standalone labs**: Individual labs can no longer be launched independently. Acceptable because the workbench provides equivalent access.
- **Larger workbench bundle**: All renderer code is now bundled into the workbench. Acceptable for a dev tool; code-splitting could be added later if needed.
- **env-lab controls coupled to workbench**: `EnvLabControls` is rendered directly by the workbench shell when a tool section is active. This means the env controls component must be importable without pulling in Three.js initialization.
