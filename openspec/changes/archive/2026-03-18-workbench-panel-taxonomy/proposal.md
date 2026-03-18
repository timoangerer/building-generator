## Why

The workbench left panel and the Leva floating panel have overlapping, unclear responsibilities. The environment section in the sidebar lists 4 presets as separate items, but clicking any of them just mounts the same environment viewer — the actual preset differentiation only happens through the Leva "Preset" dropdown. Users can't tell what the left panel does vs. what the viewer controls do. This creates confusion about the intended workflow.

## What Changes

- **Clarify left panel as "selection/presets"**: Clicking an environment preset in the sidebar SHALL apply that preset immediately. The left panel becomes the durable "what am I looking at?" selector.
- **Clarify Leva panel as "ephemeral tweaks"**: The Leva panel shows the current state of the selected preset and allows temporary parameter adjustments. Selecting a different preset in the sidebar resets tweaks.
- **Remove redundant Leva preset dropdown**: Since preset selection now lives in the sidebar, the Leva "Preset" folder becomes unnecessary. Layer selections and parameter controls remain in Leva for fine-tuning.
- **Apply preset on sidebar click**: When a user clicks an environment preset in the sidebar, the workbench SHALL call the env API to apply that preset's layer selections, parameters, and fog — not just mount the renderer.

## Capabilities

### New Capabilities

_(none — this is a reorganization of existing UI responsibilities)_

### Modified Capabilities

- `workbench-shell`: Sidebar environment preset clicks now apply the selected preset to the env scene (not just mount the renderer). Selection state tracks which preset is active.
- `env-lab`: Remove the Leva "Preset" dropdown (preset selection moves to sidebar). Leva controls only show layer selections + parameters + fog for the currently active preset. Switching presets from sidebar resets Leva state.

## Impact

- `src/workbench/workbench-shell.tsx` — sidebar click handler for environment presets, selection state, preset application logic
- `src/viewers/environment/env-controls.tsx` — remove Preset folder from Leva, keep layer/param/fog controls
- `src/viewers/environment/presets.ts` — no changes to preset data, but presets are now applied from workbench shell instead of Leva
- `src/viewers/environment/env-scene.ts` — `EnvSceneApi` may need a `loadPreset(name)` convenience method if not already present
