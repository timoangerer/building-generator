## Why

The codebase has four separate Vite entry points — `gallery`, `env-lab`, `facade-lab`, and `plot-lab` — each with its own HTML shell, viewer entry file, and `dev:*` npm script. Rendering utilities are scattered across `src/rendering/`, `src/gallery/renderers/`, and `src/facade-lab/renderer/`. UI components live in `src/components/ui/` while hooks and utils are in `src/hooks/` and `src/lib/`. This fragmentation:

1. **Duplicates infrastructure**: Each lab has its own HTML shell, Vite entry, and React bootstrap — all near-identical boilerplate
2. **Scatters rendering code**: Renderers, shared Three.js setup, and geometry utilities are spread across multiple unrelated directories
3. **Blocks reuse**: The env-lab scene can't be embedded in the workbench because it's a standalone entry point, not a reusable module
4. **Inflates lint rules**: Every new viewer directory must be added to `no-three-outside-rendering` and `no-internal-module-imports` allow-lists

## What Changes

- **Eliminate separate lab entry points**: Delete `src/env-lab/index.html`, `src/facade-lab/index.html`, `src/plot-lab/index.html`, `src/gallery/index.html` and their viewer entry files. Remove corresponding Vite `rollupOptions.input` entries and `dev:*` scripts
- **Create `src/viewers/` module**: Consolidate all rendering code under `src/viewers/` with three sub-modules:
  - `src/viewers/shared/` — Three.js setup, geometry utilities, shared types (`StageRenderer`, `ToolRenderer`, `RenderOptions`)
  - `src/viewers/stages/` — per-stage renderers (plot, massing, element, facade, building, scene) plus renderer factory
  - `src/viewers/environment/` — env-lab scene, layer system, presets, controls, and a new `ToolRenderer`-based env renderer
- **Move UI to `src/ui/`**: Relocate `src/components/ui/*` → `src/ui/components/`, `src/hooks/` → `src/ui/hooks/`, `src/lib/` → `src/ui/lib/`
- **Rename gallery → workbench**: Merge `src/gallery/` into `src/workbench/` as a single entry point. The workbench shell now supports both fixture sections (generator stages) and tool sections (environment presets)
- **Embed env-lab in workbench**: The environment viewer becomes a tool section in the workbench sidebar, no longer requiring a separate browser tab
- **Simplify lint rules**: Replace five directory entries with a single `viewers` entry in both `no-three-outside-rendering` and `no-internal-module-imports`

## Capabilities

### Modified Capabilities
- `workbench-shell`: Absorbs gallery shell; gains tool section support for environment presets alongside fixture sections
- `gallery-viewer`: Renamed to workbench; renderers move to `src/viewers/stages/`; shared utilities move to `src/viewers/shared/`
- `workbench-rendering`: Renderers now live under `src/viewers/stages/` and import shared setup from `src/viewers/shared/`
- `env-lab`: Scene and layer system move to `src/viewers/environment/`; standalone entry point removed; env-lab is now accessible as a tool section in the workbench
- `facade-lab`: Standalone entry point removed; facade canvas renderer moves to `src/viewers/stages/facade-canvas.ts`; data source moves to `src/viewers/stages/facade-data.ts`
- `plot-lab`: Standalone entry point removed; plot canvas was already a gallery renderer and moves to `src/viewers/stages/`

## Impact

- **Deleted files**: `src/env-lab/index.html`, `src/env-lab/viewer/main.tsx`, `src/facade-lab/index.html`, `src/facade-lab/index.ts`, `src/facade-lab/viewer/main.tsx`, `src/gallery/index.html`, `src/gallery/main.tsx`, `src/gallery/gallery-shell.tsx`, `src/gallery/types.ts`, `src/plot-lab/index.html`, `src/plot-lab/viewer/main.tsx`, `src/plot-lab/viewer/plot-canvas.tsx`, `src/rendering/index.ts`
- **New files**: `src/viewers/index.ts`, `src/viewers/shared/index.ts`, `src/viewers/shared/types.ts`, `src/viewers/environment/index.ts`, `src/viewers/environment/env-renderer.ts`, `src/viewers/environment/env-controls.tsx`, `src/workbench/types.ts`, `src/workbench/workbench-shell.tsx`
- **Modified files**: `vite.config.ts`, `package.json`, `components.json`, `playwright.config.ts`, lint rules
- **Breaking changes**: All `dev:gallery`, `dev:env-lab`, `dev:facade-lab`, `dev:plot-lab` scripts removed; single `dev` script serves workbench
