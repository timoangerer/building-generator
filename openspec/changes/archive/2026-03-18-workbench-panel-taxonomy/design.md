## Context

The workbench has two UI surfaces: a ShadCN sidebar (left) and a Leva floating panel (right). Currently, clicking an environment preset in the sidebar mounts the env renderer but doesn't apply the selected preset — all 4 sidebar items behave identically. The actual preset switch lives in a Leva "Preset" dropdown, creating redundancy and confusion about what each panel is for.

The desired mental model: **sidebar = durable selection** (what to view), **Leva = ephemeral tweaks** (how it looks right now).

## Goals / Non-Goals

**Goals:**
- Sidebar environment clicks apply the selected preset immediately
- Remove the Leva "Preset" dropdown (preset selection is a sidebar concern)
- Leva shows only layer-level controls (terrain/sky/water layer selection + params + fog) for fine-tuning the active preset
- Switching presets in the sidebar resets all Leva tweaks to the preset's defaults
- Reuse the existing env renderer when switching presets (avoid WebGL context teardown/rebuild)

**Non-Goals:**
- Changing the fixture sections in any way
- Adding new environment presets
- Adding "save custom preset" functionality
- Changing the Display or Seed Leva folders

## Decisions

### 1. Pass selected preset name from workbench shell into EnvLabControls

**Choice:** Add a `presetName` prop to `EnvLabControls`. When `presetName` changes, the component applies the preset (layers, overrides, fog) and resets all Leva controls to match.

**Why not keep preset selection in Leva?** The whole point is to move preset selection to the sidebar. The Leva panel should only contain tweakable parameters, not navigation-level selections.

**Why a prop rather than calling `api.loadPreset()` in workbench-shell?** The preset application logic already lives in `env-controls.tsx` (the `useEffect` watching `preset`). Rather than duplicating it in workbench-shell, we drive it via prop. This keeps the env module self-contained.

### 2. Reuse env renderer across preset switches

**Choice:** When switching between environment presets in the sidebar, do NOT dispose and remount the tool renderer. Instead, keep the same `EnvSceneApi` alive and just apply the new preset.

**Why:** Disposing and recreating a WebGL context per preset switch is expensive and causes flicker. The existing renderer reuse pattern (used for fixture stage renderers) should extend to tool renderers. The workbench-shell already has a `toolRendererRef` — we just need to avoid re-mounting when only the preset changes within the same tool.

**How:** Track `toolId` separately from preset selection. Only call `getToolRenderer` + `mount` when the tool itself changes (e.g., fixture → environment). When the sidebar changes between environment presets, keep the renderer and pass the new preset name to `EnvLabControls`.

### 3. Remove the Preset Leva folder entirely

**Choice:** Delete the `useControls("Preset", ...)` block from `EnvLabControls`. The Terrain, Sky, Water, and Fog folders remain.

**Alternative considered:** Keep it as a read-only display showing the active preset name. Rejected because it adds no value — the sidebar already highlights which preset is active.

## Risks / Trade-offs

- **[Risk] Leva state gets out of sync with preset** → Mitigation: When `presetName` prop changes, explicitly call all Leva `set*Controls()` functions to reset values. This pattern already exists in the current preset-change `useEffect`.
- **[Risk] Renderer reuse across preset switches may leak state** → Mitigation: The `api.setLayer()` calls already dispose old layers before creating new ones. Fog is overwritten. No new leak surface.
- **[Trade-off] Users can no longer quick-switch presets from the Leva panel** → Acceptable: sidebar is always visible and one click away. This is the intended UX.
