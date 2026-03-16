## Context

The art direction targets a "soft stylized" look inspired by Townscaper and Dragon Quest XI — HD-stylized assets with warm atmosphere, semi-realistic water, and lush terrain. The building generator pipeline exists and produces SceneResult data, but the workbench renders it in a dark void with no environment. Before integrating environment rendering into the main workbench, we need a laboratory to prototype and compare different approaches for water, sky, and terrain independently.

The env-lab is a scratchpad. It has no contract with the main workbench. The terrain must be flat in the center (to allow future building placement) but the lab itself renders empty environments only.

## Goals / Non-Goals

**Goals:**
- Each environment layer (water, sky, terrain) is independently swappable at runtime
- At least 3 approaches per layer to cover the style spectrum from minimal/toylike to HD-stylized
- A control panel lets you switch approaches, tweak per-approach parameters, and adjust fog
- Named presets define coherent combos (all layers + fog) for quick A/B comparison
- Runs as a standalone dev server, independent of the main workbench
- Each approach is self-contained in its own file — easy to add new ones

**Non-Goals:**
- Integration with the main workbench or generation pipeline
- Rendering buildings or generated content in the lab
- Performance optimization or draw-call budgeting
- Deterministic/seeded output (this is a visual scratchpad)
- Vegetation, props, or anything beyond water/sky/terrain/fog
- Mobile support

## Decisions

### 1. EnvLayer interface — the common contract

Every water, sky, and terrain module implements:

```ts
interface ParamDescriptor {
  key: string
  label: string
  type: "number" | "color"
  min?: number
  max?: number
  step?: number
  default: number | string
}

interface EnvLayer {
  name: string
  create(scene: THREE.Scene, camera: THREE.Camera): void
  update(dt: number, elapsed: number): void
  setParam(key: string, value: number | string): void
  getParams(): ParamDescriptor[]
  dispose(): void
}
```

`create` adds objects to the scene. `update` runs every frame for animation. `setParam` allows live tweaking from the UI. `dispose` cleans up. This is deliberately minimal — no coupling between layers.

**Why not a class hierarchy?** Each approach may have wildly different internals (one is a PlaneGeometry, another is a custom ShaderMaterial, another is a Three.js example import). A flat interface lets each be whatever it needs to be.

### 2. Water approaches

| ID | Name | Technique | Style Zone |
|----|------|-----------|------------|
| `flat-sine` | Flat + Sine Waves | PlaneGeometry with vertex Y displacement via layered sine functions in the update loop | Minimal / toylike |
| `stylized-shader` | Stylized Shader | Custom ShaderMaterial with Gerstner wave vertex displacement, depth-based color gradient (shallow turquoise → deep blue), simple foam at shoreline via distance-to-terrain | Townscaper – DQ XI sweet spot |
| `threejs-ocean` | Three.js Ocean | `Water` from `three/examples/jsm/objects/Water2.js` — reflection/refraction with normal map animation | Realistic-ish / "Unreal Engine vibe" |

**Tweakable params** (vary by approach):
- Wave height, wave speed, wave count
- Deep color, shallow color
- Foam threshold, foam color
- Opacity, reflectivity

### 3. Sky approaches

| ID | Name | Technique | Style Zone |
|----|------|-----------|------------|
| `gradient` | Gradient Sky | Large inverted box or full-screen quad with a vertical two-color gradient shader (zenith → horizon) | Clean / minimal |
| `hemisphere-dome` | Hemisphere Dome | Inverted SphereGeometry with vertex colors encoding a gradient. Can include a horizon glow band | Stylized |
| `atmospheric` | Atmospheric Sky | Three.js `Sky` from `three/examples/jsm/objects/Sky.js` — Preetham atmospheric scattering model with sun position control | Realistic-ish / golden hour capable |

**Tweakable params:**
- Zenith color, horizon color (gradient/dome)
- Sun elevation, sun azimuth, turbidity, Rayleigh coefficient (atmospheric)

### 4. Terrain approaches

All terrains share a constraint: **flat plateau in the center** for future building placement. The island is roughly circular with an irregular coastline.

| ID | Name | Technique | Style Zone |
|----|------|-----------|------------|
| `plateau-noise` | Plateau + Noise Falloff | Flat center disc, radial distance falloff with Perlin/simplex noise for irregular cliff edges dropping to water level. Vertex-colored by height (green top, brown cliff, sandy base) | Natural-ish |
| `layered-strata` | Layered Strata | Flat top, then 2-3 concentric "geological layers" stepping down with slight noise irregularity per layer edge. Each stratum gets a distinct color | Diorama / toylike |
| `smooth-slope` | Smooth Slope + Zones | Flat center, smooth noise-modulated slope. Height-based vertex coloring defines zones: plateau (grass green) → slope (darker green) → rock (gray-brown) → shore (sand) → water edge | DQ XI territory |

**Terrain-to-water coupling** is **loose**: the terrain optionally exports a `getHeightAt(x, z): number` function. Water approaches that want depth-based coloring or shoreline foam can query it. Water approaches that don't need it ignore it. This keeps layers independently swappable while enabling richer interactions when both sides support it.

### 5. Fog as preset property

Fog is not a standalone swappable layer. Instead, each preset defines fog settings:

```ts
interface FogConfig {
  enabled: boolean
  type: "linear" | "exponential"
  color: string        // hex
  near?: number        // linear
  far?: number         // linear
  density?: number     // exponential
}
```

The control panel exposes fog tweaks (enabled, color, near/far or density) alongside the layer selectors. Fog color should generally match the sky's horizon color for cohesion.

### 6. Preset system

Named presets define complete environment configurations:

```ts
interface EnvPreset {
  name: string
  water: string          // approach ID
  sky: string            // approach ID
  terrain: string        // approach ID
  fog: FogConfig
  overrides?: Record<string, Record<string, number | string>>  // layer → param → value
}
```

Initial presets:

| Preset | Water | Sky | Terrain | Fog | Mood |
|--------|-------|-----|---------|-----|------|
| **Minimal** | flat-sine | gradient | plateau-noise | light linear, warm white | Clean, simple, fast to load |
| **Diorama** | stylized-shader | hemisphere-dome | layered-strata | warm haze, short range | Townscaper-like, toylike charm |
| **Tropical** | stylized-shader | atmospheric | smooth-slope | subtle blue, long range | DQ XI vibes, lush and warm |
| **Dramatic** | threejs-ocean | atmospheric | plateau-noise | golden fog, medium range | Sunset/golden hour showcase |

Switching a preset sets all dropdowns + params. Manually changing any dropdown switches to "Custom".

### 7. Folder structure

```
src/env-lab/
  types.ts                      # EnvLayer, ParamDescriptor, FogConfig, EnvPreset
  registry.ts                   # maps string IDs → factory functions for each layer
  presets.ts                    # preset definitions
  water/
    index.ts                    # re-exports all water approaches
    flat-sine.ts
    stylized-shader.ts
    threejs-ocean.ts
  sky/
    index.ts
    gradient.ts
    hemisphere-dome.ts
    atmospheric.ts
  terrain/
    index.ts
    plateau-noise.ts
    layered-strata.ts
    smooth-slope.ts
  viewer/
    main.tsx                    # React entry point
    env-scene.ts                # Three.js scene setup, layer lifecycle, render loop
    control-panel.tsx           # ShadCN/Tailwind UI — dropdowns, sliders, color pickers
```

### 8. Separate Vite entry point

A new `vite.env-lab.config.ts` at the project root points to `src/env-lab/viewer/main.tsx` and a dedicated `env-lab.html`. The `dev:env-lab` script in package.json runs this config. This keeps the env-lab fully isolated from the main workbench build.

### 9. Viewer scene setup

The env-lab viewer provides:
- PerspectiveCamera with OrbitControls, positioned to see the full island
- A single warm DirectionalLight + HemisphereLight (sky/ground ambient)
- Fog applied from the active preset
- A render loop calling `layer.update(dt, elapsed)` on all active layers each frame
- The control panel as a React overlay (HTML/CSS on top of the canvas)

### 10. Adding a new approach

To add e.g. a fourth water approach:
1. Create `src/env-lab/water/new-approach.ts` implementing `EnvLayer`
2. Add it to `src/env-lab/water/index.ts`
3. Register it in `registry.ts`
4. Optionally add it to presets

No other files need to change. The control panel auto-populates dropdowns from the registry.

## Risks / Trade-offs

- **Loose terrain-water coupling limits shoreline quality**: Depth-based coloring and foam require the water to know where the terrain is. The `getHeightAt` optional query is a compromise — it works but isn't as integrated as generating water and terrain together. Acceptable for a scratchpad.
- **Three.js example imports (`Water`, `Sky`) are not stable API**: They live in `examples/jsm/` and can change between Three.js versions. Pin the Three.js version (already at ^0.164.1) and treat these as reference implementations we may inline/modify later.
- **No noise library included**: Terrain approaches need Perlin/simplex noise. Options: (a) use a tiny inline implementation, (b) add a dependency like `simplex-noise`. Prefer (a) to keep dependencies minimal — a 30-line simplex implementation is sufficient.
- **Control panel complexity**: ShadCN components for dropdowns + sliders + color pickers could get verbose. Keep it functional, not polished — this is a lab tool, not a product UI.
