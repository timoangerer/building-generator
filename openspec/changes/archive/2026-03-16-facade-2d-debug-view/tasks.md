## 1. Element Bounds Utility

- [x] 1.1 Create `src/generators/element/element-bounds.ts` with `computeElementBounds(element: ElementDefinition): ElementBounds` that iterates all geometry parts, computes min/max x/y/z extent accounting for part positions + dimensions (box, cylinder, half_cylinder shapes), and returns `{ width, height, depth }`
- [x] 1.2 Create `src/generators/element/element-bounds.test.ts` — test against known elements: single box part, multiple parts with offsets, sill overhang extends width (window-tall), cylinder/half-cylinder bounds, all dimensions positive

## 2. Contract Additions

- [x] 2.1 Modify `src/contracts/facade.ts` — add optional `scale?: Vec3` to `ElementPlacement`, add optional `bayGrid?: { floorIndex: number; bayIndex: number; elementId: string }[]` to `WallFacade`
- [x] 2.2 Modify `src/contracts/facade.schema.ts` — add `scale: Vec3Schema.optional()` to `ElementPlacementSchema`, add `bayGrid` array schema (optional) to `WallFacadeSchema`

## 3. Element Proportion Fix

- [x] 3.1 Modify `src/generators/element/element-generator.ts` — resize window builder functions: window-tall (0.9×1.6), window-arched (0.9 frame, ~2.0 total), window-shuttered (0.9+shutters, 1.5), window-arch-shut (0.9+shutters, ~2.0), window-small-sq (0.6×0.6). Scale internal part proportions (pane inset, sill overhang, shutter width) proportionally
- [x] 3.2 Modify `src/generators/element/element-generator.test.ts` — update dimension assertions to match new sizes

## 4. Facade Generation Improvements

- [x] 4.1 Modify `src/generators/facade/facade-generator.ts` — categorize availableElements into windows, entryDoors, balconyDoors; implement seeded per-building primary/accent window selection
- [x] 4.2 Implement per-floor element assignment rules: ground floor center bay = entry door (RNG pick), other bays = primary window; middle floors = primary + 1-2 accent bays; top floor = primary or small-sq variation
- [x] 4.3 Implement Y-position refinement using `computeElementBounds`: doors bottom at floor base, windows sill at ~0.9m above floor
- [x] 4.4 Implement optional proportional scaling: compute `min(bayWidth*0.8/bounds.width, floorHeight*0.7/bounds.height, 1.5)`, only set scale on placement when > 1.05
- [x] 4.5 Populate `WallFacade.bayGrid` with floor/bay/elementId entries for exposed walls
- [x] 4.6 Modify `src/generators/facade/facade-generator.test.ts` — add tests: "uses more than one unique window element", "door Y position near floor base", "bay grid covers all floor/bay cells for exposed walls", "all placements with scale have scale > 0"

## 5. Workbench Scale Support

- [x] 5.1 Modify `src/workbench/main.tsx` — when building instance transforms, check `placement.scale` and apply to dummy object before `updateMatrix()`. Missing scale treated as (1,1,1)

## 6. Facade Lab Infrastructure

- [x] 6.1 Create `facade-lab.html` — HTML shell following env-lab pattern, pointing at `/src/facade-lab/viewer/main.tsx`
- [x] 6.2 Create `vite.facade-lab.config.ts` — copy of env-lab config with `input: "facade-lab.html"`, `open: "/facade-lab.html"`
- [x] 6.3 Modify `package.json` — add `"dev:facade-lab": "vite --config vite.facade-lab.config.ts"`

## 7. Facade Lab Data Source

- [x] 7.1 Create `src/facade-lab/data-source.ts` — implement `getFacadeLabData(seed)` wrapping `runCityPipeline` to list buildings/walls, and `getWallFacadeView(seed, buildingIndex, wallIndex)` returning `FacadeLabView`
- [x] 7.2 Create `src/facade-lab/data-source.test.ts` — test determinism, valid structure, correct bay count computation

## 8. Facade Lab 2D Renderer

- [x] 8.1 Create `src/facade-lab/renderer/facade-canvas.ts` — implement `renderFacade2D(ctx, view, mode, palette)` with coordinate system X=along wall, Y=vertical, canvas transforms for viewport fitting
- [x] 8.2 Implement wireframe mode: floor lines, bay grid, edge margins (dashed), element bounding rectangles with elementId labels, dimension annotations (bay width, floor height, element w×h)
- [x] 8.3 Implement rendered mode: wall background in light color, subtle gray grid, element composite parts drawn as colored rectangles using palette colors
- [x] 8.4 Apply `placement.scale` to drawn element bounds/parts in both modes

## 9. Facade Lab Viewer UI

- [x] 9.1 Create `src/facade-lab/viewer/main.tsx` — React app with full-viewport canvas, state for seed/buildingIndex/wallIndex/viewMode, re-renders canvas on state change
- [x] 9.2 Create `src/facade-lab/viewer/control-panel.tsx` — ShadCN/Tailwind panel: seed input, building dropdown, wall dropdown (filtered to exposed walls with length shown), wireframe/rendered toggle, info readout (bay count, usable width, floor count, elements used)

## 10. Integration Verification

- [x] 10.1 Run `npx vitest run` — all new and existing tests pass
- [x] 10.2 Run `npm run dev:facade-lab` — verify 2D facade view renders with wireframe grid, labels, rendered mode with colored parts, control panel works
- [x] 10.3 Run `npm run dev` — verify 3D workbench renders improved facades with variety and proper proportions
