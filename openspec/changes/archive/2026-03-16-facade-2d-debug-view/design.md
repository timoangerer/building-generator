## Context

The facade generator currently always picks the first window and first door from the element catalog, producing visually monotonous facades. Windows are 0.6m wide in 2.5m bays — filling only ~24% of bay width — making them look tiny and isolated. All elements are vertically centered in their floor, so doors float above the ground. There is no way to inspect a facade in isolation; the only view is the full 3D workbench.

We already have the env-lab pattern (separate Vite entry point, standalone dev server, control panel) as a proven approach for isolated visualization tools. The element catalog already defines 9 Mediterranean elements with composite geometry — we just need to use them properly.

## Goals / Non-Goals

**Goals:**
- A standalone 2D facade viewer ("facade lab") for inspecting facades by seed, building, and wall
- Two rendering modes: wireframe (grid + labels + dimensions) and rendered (colored element parts)
- Realistic element proportions: windows that fill ~50-60% of bay width
- Element variety: multiple window types per building, not just the first match
- Correct vertical positioning: doors on floor base, windows at sill height
- Inspectable intermediate data: bay grid assignment available for debugging
- All changes backward-compatible with existing 3D workbench

**Non-Goals:**
- 3D rendering in the facade lab (it's a 2D debug tool)
- New element types (only resizing existing ones)
- Balcony placement logic (balcony doors are available but placed like regular elements)
- Performance optimization of the renderer
- Mobile or responsive layout for the lab UI

## Decisions

### 1. Element bounds utility

A new `computeElementBounds(element)` function iterates all composite geometry parts, accounting for part positions + dimensions, and returns the axis-aligned bounding box as `{ width, height, depth }`. This is needed by:
- The 2D renderer (to draw element outlines)
- Y-position logic (to compute sill and door placement)
- Proportional scaling (to compare element size vs bay size)

Lives in `src/generators/element/element-bounds.ts` — it's a pure utility on the element contract types.

### 2. Facade lab follows env-lab pattern

The facade lab mirrors the env-lab infrastructure:
- `facade-lab.html` + `vite.facade-lab.config.ts` + `dev:facade-lab` script
- React entry point at `src/facade-lab/viewer/main.tsx`
- ShadCN/Tailwind control panel as overlay

**Key difference from env-lab**: the facade lab is a 2D Canvas renderer, not Three.js. It renders facade data as a 2D elevation view using the Canvas 2D API.

### 3. Data source layer

`src/facade-lab/data-source.ts` wraps `runCityPipeline(seed)` and exposes:
- `getFacadeLabData(seed)` — lists all buildings with their walls
- `getWallFacadeView(seed, buildingIndex, wallIndex)` — returns a `FacadeLabView` with all data needed to render a single wall's facade

This is a pure data layer — no rendering, fully serializable. The viewer calls data source functions and passes the result to the canvas renderer.

### 4. 2D Canvas rendering approach

Uses HTML5 Canvas 2D API (not Three.js) because:
- Facades are fundamentally 2D elevation views
- Canvas 2D makes dimension annotations and text labels trivial
- No WebGL overhead for what is essentially colored rectangles and text
- Easier to add wireframe overlays, dashed lines, and measurement annotations

Coordinate system: X = along wall (0 → wall.length), Y = vertical (0 → totalHeight). Canvas transforms (translate + scale) handle fitting to viewport.

Two modes:
- **Wireframe**: Floor lines, bay grid, edge margins (dashed), element bounding rectangles with elementId labels, dimension annotations
- **Rendered**: Same grid (subtle gray), element composite parts drawn as colored rectangles using palette colors, wall background in light color

### 5. Element resizing strategy

Scale window dimensions to fill ~50-60% of the default 2.5m bay width:

| Element | Current w → New w | Current h → New h |
|---|---|---|
| window-tall | 0.6 → 0.9 | 1.3 → 1.6 |
| window-arched | 0.6 → 0.9 | ~1.6 → ~2.0 |
| window-shuttered | 0.6+shutters → 0.9+shutters | 1.2 → 1.5 |
| window-arch-shut | 0.6+shutters → 0.9+shutters | ~1.6 → ~2.0 |
| window-small-sq | 0.5 → 0.6 | 0.5 → 0.6 |
| doors | unchanged | unchanged |

Internal part proportions (pane inset, sill overhang, shutter width) scale proportionally. The resize is done by modifying the builder functions in `element-generator.ts`.

### 6. Seeded element selection

Replace `find(first window)` / `find(first door)` with seeded variety:

1. Categorize `availableElements` into `windows`, `entryDoors` (non-balcony doors), `balconyDoors`
2. Per building: pick a "primary window" and "accent window" using seeded RNG
3. Per-floor rules:
   - **Ground floor**: center bay = entry door (RNG pick), other bays = primary window
   - **Middle floors**: primary window most bays; 1-2 accent bays get accent window or balcony door
   - **Top floor**: primary window or small-sq for variation
4. The assignment is stored as a `bayGrid` array on `WallFacade` for inspection

### 7. Y-position refinement using element bounds

Currently all elements at `floor.baseY + floor.height / 2` (vertical center). Fix using `computeElementBounds`:
- **Doors**: bottom at floor base → `y = floor.baseY + bounds.height / 2`
- **Windows**: sill at ~0.9m above floor → `y = floor.baseY + 0.9 + bounds.height / 2`

### 8. Optional proportional scaling

Safety net using new `scale` field on `ElementPlacement`:
```
maxW = bayWidth * 0.8 / bounds.width
maxH = floorHeight * 0.7 / bounds.height
scale = min(maxW, maxH, 1.5)
→ only set if > 1.05
```

After the element resize in decision 5, this should rarely trigger. It's a fallback for edge cases (e.g., very narrow bays).

### 9. Contract additions are backward-compatible

- `ElementPlacement.scale` is optional (`Vec3 | undefined`), defaults to `{1,1,1}` when absent
- `WallFacade.bayGrid` is optional — existing code ignores it
- Renderers check `if (placement.scale)` before applying

## Risks / Trade-offs

- **Resizing elements may break existing snapshot/visual tests**: Element dimension tests need updating. The 3D workbench will render larger windows — this is intentional and desired, but existing screenshots won't match.
- **Bay grid doubles WallFacade serialization size**: Acceptable for debugging. The grid is optional and can be stripped for production if needed.
- **Canvas 2D lacks WebGL acceleration**: Fine for a debug tool. A single facade is at most a few hundred rectangles.
- **Proportional scaling can distort element geometry**: Capped at 1.5x and only applied when element-to-bay ratio is poor. After resizing, this should be rare.
