## Context

The plot generator (`src/generators/plot/`) produces a `PlotResult` containing an array of `Plot` objects (each with `id`, `footprint: Vec2[]`, `bounds: AABB2`, `row: "A" | "B"`) and `Street` objects (`id`, `start`, `end`, `width`). Currently, the only way to see plot layout is through the full 3D workbench, where plot boundaries are inferred from building volumes. There is no isolated 2D view for inspecting the raw plot data.

The project already has a pattern for standalone viewer labs: `env-lab` uses a separate HTML entry point, its own Vite config, and a React app with a Tailwind control panel overlay. Plot-lab will follow this same pattern but use a 2D canvas (HTML Canvas 2D context) instead of Three.js, since the data is inherently flat XZ-plane geometry.

## Goals / Non-Goals

**Goals:**
- Provide a 2D top-down debug view of `PlotResult` data
- Color-code plots by row, label each with its ID
- Show streets with distinct styling
- Allow interactive adjustment of `PlotConfig` parameters with live regeneration
- Follow the established lab entry-point pattern (separate HTML, Vite config, npm script)

**Non-Goals:**
- 3D rendering or Three.js usage — this is a pure 2D canvas view
- Editing or mutating plot data — view-only
- Integration with the main workbench or routing between views
- Massing or facade visualization — only plot-level data

## Decisions

### HTML Canvas 2D instead of Three.js
**Choice:** Use the native HTML Canvas 2D API for rendering.
**Rationale:** Plot data is flat rectangles in the XZ plane. Canvas 2D is simpler, lighter, and more appropriate than setting up a Three.js orthographic camera for what is essentially colored rectangles with text labels. No GPU setup, no WebGL context, no scene graph overhead.
**Alternative considered:** Three.js with OrthographicCamera — rejected as unnecessary complexity for 2D rectangles.

### Separate entry point (following env-lab pattern)
**Choice:** `plot-lab.html` + `vite.plot-lab.config.ts` + `dev:plot-lab` script.
**Rationale:** This is the established pattern. No routing system exists, and adding one just for this would be scope creep.

### World-to-screen coordinate mapping
**Choice:** Fit the entire `PlotResult` extent into the canvas with padding, applying a uniform scale and offset. X maps to canvas X, Z maps to canvas Y (inverted so positive Z is up/north). Pan and zoom via mouse wheel / drag for exploration.
**Rationale:** The plot data uses an XZ coordinate system with Y as vertical. For 2D top-down, we project X→screenX, Z→screenY.

### Color scheme
**Choice:** Row A plots get one hue family (e.g. warm oranges), Row B gets another (e.g. cool blues). Each individual plot gets a slightly varied shade within its row's hue. Streets use a neutral gray. All colors are opaque fills with darker stroke outlines.
**Rationale:** The primary debug question is "which plots belong to which row, and are they correctly separated by the street?" Color-coding by row answers this at a glance.

## Risks / Trade-offs

- **Canvas 2D text rendering** at small scales may look blurry when zoomed out with many plots → Mitigation: only render labels when zoom level makes them legible (skip below a threshold).
- **No shared UI framework yet** (ShadCN not wired up) → Mitigation: use raw Tailwind HTML elements for the control panel, matching env-lab's approach. When ShadCN is added later, plot-lab can adopt it.
