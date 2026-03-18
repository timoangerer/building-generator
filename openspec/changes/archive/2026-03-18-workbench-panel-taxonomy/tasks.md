## 1. EnvLabControls: Accept presetName prop, remove Preset dropdown

- [x] 1.1 Add `presetName: string` to `EnvLabControls` props alongside existing `api` prop
- [x] 1.2 Remove the `useControls("Preset", ...)` block and all related state (`prevPresetRef`, `setPresetControls`)
- [x] 1.3 Add a `useEffect` watching `presetName` that applies the matching preset from `presets` array — set layers, apply overrides, apply fog, and reset all Leva controls (`setTerrainControls`, `setSkyControls`, `setWaterControls`, `setFogControls`) to match

## 2. WorkbenchShell: Reuse env renderer across preset switches

- [x] 2.1 Track the active tool ID separately (e.g., `mountedToolRef`) so the shell knows whether the env renderer is already mounted
- [x] 2.2 In the tool-mounting `useEffect`, skip dispose+remount when the tool ID hasn't changed (only the preset/itemIndex changed) — just let the `presetName` prop flow to `EnvLabControls`
- [x] 2.3 Pass the selected preset name to `EnvLabControls` via `presetName` prop, derived from `selectedSection.items[selection.itemIndex].id`

## 3. Verification

- [x] 3.1 Run `npm run lint` and fix any violations
- [x] 3.2 Manually verify in the workbench: clicking different environment presets in the sidebar applies them without flicker, and Leva controls reset to preset defaults
- [x] 3.3 Verify that tweaking a Leva param (e.g., terrain layer) works, and switching presets resets the tweak
