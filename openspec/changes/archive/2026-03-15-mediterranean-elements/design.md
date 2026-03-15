## Context

The element catalog currently produces 4 static box-geometry elements. The renderer creates one `InstancedMesh` per element ID using `BoxGeometry`. There is no support for multi-part elements or per-part coloring.

We need to extend the element system to produce self-contained Mediterranean-style assets (windows with shutters, doors with balconies) built from composed geometric primitives, and update the renderer to display them with role-based coloring.

## Goals / Non-Goals

**Goals:**
- Extend the geometry contract to support composite elements (multiple parts per element)
- Produce ~9 Mediterranean-style elements as finished, self-contained assets
- Color element parts by semantic role (pane, shutter, sill, etc.) via a palette system
- Render composite elements in the workbench

**Non-Goals:**
- Facade placement rules (which element goes where) — stays unchanged
- Mount/snap systems for attaching elements to each other at placement time — elements are pre-assembled
- OBJ/glTF export — future work
- Procedural variation within a single element type (e.g., randomized shutter angles) — future work
- Balcony-door placement logic changes in facade generator

## Decisions

### 1. Composite geometry as a discriminated union variant

**Decision**: Add `{ type: "composite", parts: GeometryPart[] }` alongside the existing `{ type: "box", box: BoxGeometry }` in the `ElementGeometry` union.

**Why over replacing box entirely**: Backward compatibility. Existing tests and the wall-panel element work fine as simple boxes. The `"box"` variant remains valid. The renderer handles both.

**Alternatives considered**:
- Replace `box` with `composite` everywhere: Unnecessary churn, wall panels don't need composite.
- Nested composites (parts containing parts): Over-engineering for the shapes we need.

### 2. Geometry parts use a small set of primitive shapes

**Decision**: Each `GeometryPart` has a `shape` discriminant from `"box" | "cylinder" | "half_cylinder"`, corresponding dimensions, a `role` tag, and a `position` offset (Vec3) relative to the element origin.

**Why these three shapes**: Every Mediterranean element in scope (arched windows, shutters, sills, railings, balcony slabs, balusters) is constructable from combinations of boxes and cylinders. Half-cylinder is needed for arch tops and could be done as a clipped cylinder, but having it as a first-class shape simplifies both generation and rendering.

**Alternatives considered**:
- Full CSG (boolean operations): Way too complex for the shapes needed.
- Named presets (`"arched_window"`): Moves geometry knowledge into the renderer, violating data-first principle.

### 3. Role-based coloring with palettes

**Decision**: Each `GeometryPart` carries a `role` string (e.g., `"pane"`, `"shutter"`, `"frame"`, `"sill"`, `"panel"`, `"railing"`, `"slab"`). A `ColorPalette` type maps roles to hex colors. The element catalog includes a default palette. The renderer looks up part role → color from the palette.

**Why role-based instead of per-part color**: Keeps element definitions color-agnostic. The same element catalog can be rendered with different palettes (Provençal blues, Dalmatian greens) without changing element definitions. This also means palette variation per building is possible in the future without touching element data.

**Alternatives considered**:
- Color on each part directly: Couples geometry to a specific palette, harder to vary.
- Color on ElementDefinition (one color per element): Too coarse — a shuttered window needs different colors for pane vs. shutter vs. sill.

### 4. Balcony doors are single self-contained elements

**Decision**: `balcony-door-iron` and `balcony-door-stone` are each one `ElementDefinition` whose composite geometry includes the door panes, the balcony slab, and the railing/balustrade. The facade generator places them as a single unit.

**Why not separate door + balcony**: The user's mental model is that elements are finished assets — like importing an OBJ from a modeling package. The facade generator shouldn't need to know how to assemble sub-components. This keeps the facade layer simple (just place element X at position Y) and makes the system compatible with future asset import workflows.

### 5. Renderer uses THREE.Group with merged children per element type

**Decision**: For composite elements, the renderer creates a `THREE.Group` containing child meshes for each part. For instancing, it pre-builds one merged `BufferGeometry` per element ID (merging all parts' geometries with their offsets baked in) and creates one `InstancedMesh` per (elementId, role) pair to allow per-role materials.

**Practical approach**: Since `InstancedMesh` requires uniform geometry and material, and composite elements have multiple materials (one per role), each unique (elementId, role) combination gets its own `InstancedMesh`. The instance transforms are identical across roles for the same element — they just render different parts.

**Alternatives considered**:
- One `InstancedMesh` per element with vertex colors: Requires custom shaders, breaks `MeshToonMaterial`.
- Individual meshes (no instancing): Won't scale if many elements are placed.

### 6. ElementType gains "balcony" variant

**Decision**: Add `"balcony"` to the `ElementType` union. Balcony-door elements use type `"door"` (they function as doors for facade placement). The standalone `"balcony"` type is reserved for future use if balconies are ever separated from doors.

Actually, simpler: balcony-door elements have type `"door"` since they occupy a door slot in the facade. No new ElementType needed for this change. The balcony is geometry within a door element.

**Revised decision**: Keep `ElementType` as `"window" | "door" | "wall_panel"`. Balcony-door elements are typed as `"door"`.

## Risks / Trade-offs

**[Risk] Instancing complexity with per-role materials** → The (elementId, role) instancing approach means more draw calls than the current single-InstancedMesh-per-element approach. For ~9 element types with ~3-5 roles each, this is ~30-40 InstancedMesh objects. Acceptable for the current scale. If it becomes a bottleneck, we can merge geometries with vertex colors later.

**[Risk] Half-cylinder geometry in Three.js** → Three.js doesn't have a native half-cylinder. We'll use `CylinderGeometry` with `thetaLength: Math.PI` and rotate appropriately. Straightforward but needs care with orientation.

**[Risk] Composite geometry inflates contract size** → A shuttered arched window has ~5 parts. The serialized catalog grows but remains small (9 elements × ~5 parts × ~6 fields = ~270 fields). No real concern.

**[Trade-off] Pre-assembled balconies limit mix-and-match** → A balcony-door-iron and balcony-door-stone are distinct catalog entries. To add a third balcony style, you add another full element. This is intentional — keeps the system simple and asset-import-compatible. If combinatorial explosion becomes a problem, a future compositing layer can address it.
