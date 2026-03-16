## 1. Scaffolding & Build Setup

- [x] 1.1 Create `src/env-lab/types.ts` with `EnvLayer`, `ParamDescriptor`, `FogConfig`, and `EnvPreset` interfaces
- [x] 1.2 Create `env-lab.html` entry point at project root
- [x] 1.3 Create `vite.env-lab.config.ts` pointing to `src/env-lab/viewer/main.tsx`
- [x] 1.4 Add `"dev:env-lab"` script to `package.json`
- [x] 1.5 Create `src/env-lab/registry.ts` with layer registration and lookup by category + ID
- [x] 1.6 Create `src/env-lab/presets.ts` with the four preset definitions (Minimal, Diorama, Tropical, Dramatic)
- [x] 1.7 Verify `npm run dev:env-lab` starts and shows a blank Three.js scene

## 2. Terrain Approaches

- [x] 2.1 Add inline simplex noise utility (small self-contained implementation, no external dependency)
- [x] 2.2 Implement `src/env-lab/terrain/plateau-noise.ts` — flat center, radial noise falloff, vertex-colored cliff
- [x] 2.3 Implement `src/env-lab/terrain/layered-strata.ts` — concentric stepped layers with noise edges
- [x] 2.4 Implement `src/env-lab/terrain/smooth-slope.ts` — smooth slope with height-based color zones
- [x] 2.5 Create `src/env-lab/terrain/index.ts` re-exporting all terrain approaches and register them

## 3. Sky Approaches

- [x] 3.1 Implement `src/env-lab/sky/gradient.ts` — vertical two-color gradient background
- [x] 3.2 Implement `src/env-lab/sky/hemisphere-dome.ts` — inverted sphere with vertex-color gradient and horizon glow
- [x] 3.3 Implement `src/env-lab/sky/atmospheric.ts` — Three.js `Sky` example wrapper with sun position params
- [x] 3.4 Create `src/env-lab/sky/index.ts` re-exporting all sky approaches and register them

## 4. Water Approaches

- [x] 4.1 Implement `src/env-lab/water/flat-sine.ts` — subdivided plane with sine-wave vertex displacement
- [x] 4.2 Implement `src/env-lab/water/stylized-shader.ts` — custom ShaderMaterial with Gerstner waves, depth color, foam
- [x] 4.3 Implement `src/env-lab/water/threejs-ocean.ts` — Three.js `Water` example wrapper
- [x] 4.4 Create `src/env-lab/water/index.ts` re-exporting all water approaches and register them

## 5. Viewer & Control Panel

- [x] 5.1 Implement `src/env-lab/viewer/env-scene.ts` — Three.js scene setup (camera, orbit controls, lighting), layer lifecycle management (create/dispose on switch), render loop calling `update` on active layers, fog application
- [x] 5.2 Implement `src/env-lab/viewer/control-panel.tsx` — preset dropdown, water/sky/terrain approach dropdowns populated from registry, per-approach param controls (sliders for numbers, color inputs for colors), fog controls (enable, color, near/far)
- [x] 5.3 Implement `src/env-lab/viewer/main.tsx` — React mount, wire control panel state to env-scene layer switching and param updates
- [x] 5.4 Verify all four presets load correctly and switching between them swaps all layers without leaking objects

## 6. Polish & Verify

- [x] 6.1 Verify terrain `getHeightAt` returns plateau height for center coordinates and water approaches that use it display depth-based coloring
- [x] 6.2 Verify dispose is called on old layers when switching — no GPU resource leaks on repeated switching
- [x] 6.3 Test that adding a hypothetical new approach only requires: new file, index re-export, registry entry
