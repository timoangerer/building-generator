# Environment Lab

Status: draft

## Purpose

A standalone experimentation space for prototyping, comparing, and documenting different water, sky, and terrain rendering approaches for the island-style presentation environment. Independent from the main workbench and generation pipeline.

## Requirements

### Layer System

- Three layer categories: **water**, **sky**, **terrain**
- Each layer category has multiple swappable approaches
- All approaches implement a common `EnvLayer` interface
- Layers are independently swappable at runtime without page reload
- Each approach exposes typed parameter descriptors for live tweaking

### EnvLayer Interface

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

- `create`: adds Three.js objects to the scene
- `update`: called every frame with delta time and total elapsed seconds
- `setParam`: updates a parameter value; the layer reacts immediately
- `getParams`: returns descriptors for all tweakable parameters (used to auto-generate UI)
- `dispose`: removes all objects from scene and releases GPU resources

### Water Approaches

#### W1: Flat + Sine Waves (`flat-sine`)
- `PlaneGeometry` with subdivision (~100×100 segments)
- Vertex Y positions displaced each frame by layered sine functions
- Solid color or simple depth gradient
- **Params**: waveHeight, waveSpeed, waveFrequency, color

#### W2: Stylized Shader (`stylized-shader`)
- Custom `ShaderMaterial`
- Vertex shader: Gerstner wave displacement (2-3 overlapping wave directions)
- Fragment shader: color interpolated between deep and shallow based on water depth (uses terrain `getHeightAt` if available), Fresnel-based opacity, simple foam band near shoreline
- **Params**: waveHeight, waveSpeed, deepColor, shallowColor, foamThreshold, foamColor, opacity

#### W3: Three.js Ocean (`threejs-ocean`)
- Uses `Water` from `three/examples/jsm/objects/Water2.js` or `Water.js`
- Reflection and refraction with animated normal maps
- **Params**: waterColor, distortionScale, size (normal map tiling), speed

### Sky Approaches

#### S1: Gradient Sky (`gradient`)
- Large inverted `BoxGeometry` or full-screen background shader
- Vertical linear gradient from zenith color to horizon color
- **Params**: zenithColor, horizonColor

#### S2: Hemisphere Dome (`hemisphere-dome`)
- Inverted `SphereGeometry` with vertex colors
- Gradient from zenith through body to horizon, with optional horizon glow band
- **Params**: zenithColor, horizonColor, glowColor, glowIntensity

#### S3: Atmospheric Sky (`atmospheric`)
- Three.js `Sky` from `three/examples/jsm/objects/Sky.js`
- Preetham atmospheric scattering model
- **Params**: sunElevation, sunAzimuth, turbidity, rayleigh, mieCoefficient

### Terrain Approaches

All terrains must have a **flat center plateau** suitable for future building placement.

All terrains should expose `getHeightAt(x: number, z: number): number` for optional water-terrain coupling.

#### T1: Plateau + Noise Falloff (`plateau-noise`)
- Circular base shape with noise-modulated radius for irregular coastline
- Flat center (y = plateau height) within a configurable inner radius
- Radial falloff with simplex noise for cliff-like edges
- Vertex colors: green (top), brown (cliff), sandy (base)
- **Params**: plateauRadius, falloffWidth, noiseScale, noiseStrength, plateauHeight

#### T2: Layered Strata (`layered-strata`)
- Flat top disc, then 2-3 concentric step-downs
- Each stratum edge has slight noise irregularity
- Each layer gets a distinct vertex color
- **Params**: layerCount, layerHeight, noiseScale, topColor, midColor, baseColor

#### T3: Smooth Slope + Zones (`smooth-slope`)
- Flat center, smooth noise-modulated slope outward
- Height-based vertex coloring zones: plateau (grass) → slope (darker green) → rock (gray-brown) → shore (sand)
- Smoothest, most natural-looking option
- **Params**: plateauRadius, slopeGradient, noiseScale, grassColor, rockColor, sandColor

### Fog

- Fog is a property of presets, not a standalone layer
- Config: `{ enabled, type: "linear" | "exponential", color, near?, far?, density? }`
- Applied to `scene.fog` when preset loads or fog params change
- UI exposes fog controls alongside layer selectors

### Presets

Named combos that set all layers + fog + parameter overrides:

| Preset | Water | Sky | Terrain | Fog Style |
|--------|-------|-----|---------|-----------|
| Minimal | flat-sine | gradient | plateau-noise | light warm linear |
| Diorama | stylized-shader | hemisphere-dome | layered-strata | warm haze, short range |
| Tropical | stylized-shader | atmospheric | smooth-slope | subtle blue, long range |
| Dramatic | threejs-ocean | atmospheric | plateau-noise | golden, medium range |

- Selecting a preset populates all controls
- Manually changing any control switches preset display to "Custom"

### Viewer

- Separate Vite entry point: `dev:env-lab` script
- Three.js scene with PerspectiveCamera + OrbitControls
- Lighting: DirectionalLight (warm) + HemisphereLight (sky/ground)
- React overlay control panel with:
  - Preset dropdown
  - Water/Sky/Terrain approach dropdowns (auto-populated from registry)
  - Per-approach parameter controls (sliders for numbers, color pickers for colors)
  - Fog controls (enable, color, range/density)
- Render loop calls `update(dt, elapsed)` on all active layers

### Registry

- Central registry maps string IDs to factory functions
- Control panel reads available approaches from registry
- Adding a new approach = implement file + register in registry

## File Structure

```
src/env-lab/
  types.ts
  registry.ts
  presets.ts
  water/
    index.ts
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
    main.tsx
    env-scene.ts
    control-panel.tsx
env-lab.html                    # HTML entry point (project root)
vite.env-lab.config.ts          # Vite config (project root)
```

## Invariants

- Switching any layer at runtime must not leak Three.js objects (dispose is called on the old layer before create on the new one)
- All layers must be independently instantiable — no hidden dependencies between water/sky/terrain
- Terrain `getHeightAt` must return the plateau height for coordinates within the flat center region
- The flat center plateau must be at least 60×60 units (enough for a small city block)
