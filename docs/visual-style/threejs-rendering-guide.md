# Three.js Rendering Guide for Stylized Buildings

Status: durable reference, evolving

This document covers how common game-engine rendering techniques translate to Three.js in the browser. It's written for developers who may see tutorials or art-style breakdowns for Unity, Unreal, or Godot and need to understand what's feasible, cheap, or hard in our stack.

## The Big Picture: Three.js vs. Game Engines

Three.js uses a **single-pass forward renderer** over WebGL 2.0. That's simpler than what Unity or Unreal offer, which is both a constraint and an advantage.

### What Three.js Doesn't Have (That Game Engines Do)

| Capability | Unity / Unreal | Three.js |
|---|---|---|
| Visual shader editor | Shader Graph / Material Editor | Write GLSL directly (or TSL for WebGPU). No visual editor. |
| Deferred rendering | Built-in option | Forward only (single pass). Limited light count per object. |
| Built-in lightmapper / GI | Progressive Lightmapper / Lumen | None. Bake lighting yourself (vertex colors, lightmaps). |
| Automatic LOD generation | Built-in LOD groups with mesh simplification | `THREE.LOD` class exists, but you generate the LOD meshes yourself. |
| Compute shaders | Standard in both | WebGL 2 has none. WebGPU (Chrome only) supports them. |
| Built-in decal system | Yes | Manual implementation or community libraries. |
| Cascaded shadow maps | Built-in | Manual. Basic shadow maps with manual tuning. |

### What Three.js Does Surprisingly Well

| Capability | Why it's good |
|---|---|
| Custom shaders with instant feedback | Write GLSL, reload page, see result. No compile/restart cycle. |
| Procedural geometry | `BufferGeometry` with typed arrays — direct, fast, no engine abstraction overhead. |
| Mixing 2D UI and 3D | HTML/CSS overlay on 3D canvas is trivial (React + Three.js). |
| Hot module replacement | Vite HMR means shader changes reload in milliseconds. |
| Deployment | It's a web page. No installer, no app store. |
| Instanced rendering | `InstancedMesh` for thousands of identical elements in one draw call. |
| Matcap materials | Drop in a sphere image, get beautiful shading with zero lights. |

## Material Options

### Built-in Materials (Relevant to Our Style)

| Material | What it does | When to use |
|---|---|---|
| `MeshBasicMaterial` | Unlit, constant color | Debug views, truly flat aesthetic |
| `MeshLambertMaterial` | Cheap diffuse lighting (per-vertex) | Low-poly styles, performance-critical scenes |
| `MeshToonMaterial` | Discrete-step toon shading via gradient map | Our primary candidate for soft toon look |
| `MeshStandardMaterial` | PBR metallic-roughness | If we ever want stylized PBR |
| `MeshMatcapMaterial` | Pre-baked lighting from a sphere texture | Rapid prototyping, exploring looks without lighting setup |
| `ShaderMaterial` | Fully custom GLSL | When built-in materials can't do what we need |

### MeshToonMaterial — Our Likely Starting Point

`MeshToonMaterial` is Three.js's built-in toon shader. It works like a standard lit material but quantizes the diffuse lighting through a **gradient map** — a 1D texture that maps the 0-1 lighting value to specific colors.

Key controls:
- **`gradientMap`**: a `DataTexture` (e.g., 3-5 pixels wide) defining color bands. Use `NearestFilter` for hard cel edges, `LinearFilter` for soft transitions.
- **`color`**: base color multiplied with the gradient result.
- **`vertexColors: true`**: per-vertex colors (our primary coloring strategy).
- **`flatShading: true`**: faceted look (optional — we may prefer smooth for the "soft stylized" target).

For our "soft stylized" target, use `LinearFilter` on the gradient map with a gentle ramp — this gives smooth transitions between light and shadow rather than hard comic-book bands.

### Custom Shaders via `onBeforeCompile`

A powerful pattern: take a built-in material and surgically modify its shader. This lets you keep features like shadow reception, normal maps, and fog while changing the lighting model:

```js
material.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <output_fragment>',
    `
    // Example: quantize final color into soft bands
    gl_FragColor.rgb = floor(gl_FragColor.rgb * 4.0 + 0.5) / 4.0;
    #include <output_fragment>
    `
  );
};
```

This is how you'd add effects like rim lighting, custom AO application, or palette remapping without writing a full shader from scratch.

## Rendering Techniques and Their Three.js Implementation

### Outlines

Four approaches, ordered by recommendation for our use case:

| Technique | How | Cost | Quality | Recommendation |
|---|---|---|---|---|
| **Inverted hull** | Clone mesh, render with `BackSide`, scale outward along normals | One extra draw call per outlined object | Best control, works great with clean procedural geometry | **Use this if outlines are needed** |
| Depth/normal edge detection | Render depth + normals to textures, run Sobel filter post-process | Two render targets + one post-process pass | Uniform screen-space width, catches all edges | Good fallback |
| `OutlinePass` (Three.js) | Built-in post-process pass | Moderate | Designed for selection UI, not art-style outlines | Not recommended for art style |
| `pmndrs/postprocessing` Outline | Community post-processing library | More efficient than built-in | Better than built-in | Decent option |

For procedural buildings, the inverted-hull method is ideal because we control the geometry and can add outline meshes during generation. This avoids all post-processing cost.

### Ambient Occlusion

| Technique | When computed | Runtime cost | Quality | Recommendation |
|---|---|---|---|---|
| **Vertex-color baked AO** | During generation | Zero | Controlled, deterministic | **Primary strategy** |
| SSAO (`SSAOPass`) | Every frame | Moderate-high | Automatic, catches everything | Supplement only |
| `pmndrs/postprocessing` N8AO | Every frame | Better than SSAO | Modern, efficient | Better SSAO option |

Since we know the building structure at generation time (walls meet at right angles, windows are recessed, roofs overhang), we can compute AO analytically during generation and store it in vertex colors. This is free at runtime and gives us complete control.

### Shadows

Three.js shadow maps require manual tuning:
- Set `renderer.shadowMap.enabled = true`
- Use `PCFSoftShadowMap` for soft edges or `VSMShadowMap` for softer results
- Configure the shadow camera frustum to tightly fit the scene (loose frustums waste resolution)
- Shadow map resolution: 2048 is good for desktop, 1024 for mobile

For our diorama-style scene, a single `DirectionalLight` with shadows covers the main use case. The shadow should be soft — hard shadows look too realistic for the style we're targeting.

### Fog and Atmosphere

Three.js has built-in fog:
- `scene.fog = new THREE.Fog(color, near, far)` — linear fog
- `scene.fog = new THREE.FogExp2(color, density)` — exponential fog

For a soft stylized look, subtle warm-toned fog adds depth and reinforces the diorama feel. The fog color should harmonize with the sky/background — typically a warm pale blue or haze tone.

### Depth of Field (Tilt-Shift)

`BokehPass` from Three.js post-processing simulates depth of field. With a narrow focus range and exaggerated blur, this creates a tilt-shift miniature effect.

Performance cost: moderate (full-screen pass with multiple texture samples). Consider making this optional or only enabled for screenshots/presentation mode.

## Performance Budget and Strategies

### Draw Call Budget

This is the primary bottleneck for WebGL in the browser:

| Target | Draw call budget |
|---|---|
| Desktop (60fps) | < 200 draw calls |
| Mobile (30-60fps) | < 50-100 draw calls |

For a scene with ~20 buildings, each building must average < 5-10 draw calls on desktop. Strategies:

1. **Merge geometry**: `BufferGeometryUtils.mergeGeometries()` to combine all same-material parts of a building into one mesh. If all building elements use vertex colors + one material, an entire building = 1 draw call.

2. **Instanced rendering**: `InstancedMesh` for repeated elements (windows, doors, balcony railings). One draw call renders thousands of identical meshes with per-instance transforms and colors.

3. **Texture atlas**: one atlas texture for all building element detail textures → one material → one draw call.

4. **Minimize material variety**: every unique material is a potential draw call boundary. Vertex colors + one shared material beats per-element materials.

### Shader Compilation

WebGL compiles shaders at first use, which can cause a visible stutter ("shader jank") on the first frame. Mitigations:
- Call `renderer.compile(scene, camera)` during a loading screen
- Keep shader count low (fewer unique materials = fewer shaders to compile)
- Avoid complex shader branching

### Texture Memory

| Resolution | Approximate GPU memory |
|---|---|
| 1024x1024 RGBA | ~4 MB |
| 2048x2048 RGBA | ~16 MB |
| 4096x4096 RGBA | ~64 MB |

For stylized buildings, small textures are fine. A 1024x1024 atlas can hold dozens of element textures. Use KTX2/Basis compressed textures to cut GPU memory significantly.

### Post-Processing Budget

Each post-processing pass renders a full-screen quad. On a 1920x1080 display, that's ~2M fragments per pass. On 4K, ~8M.

Recommendation: **one post-processing pass maximum** for the default rendering mode. If bloom is needed, use it alone. If outlines are needed, prefer geometry-based (inverted hull) over post-processing.

## Translating Game Engine Tutorials to Three.js

When you find a tutorial for a stylized effect in Unity, Unreal, or Godot, here's how to think about the translation:

### "Use a Shader Graph / Material Editor node"

→ Write equivalent logic in GLSL inside a `ShaderMaterial`, or use `onBeforeCompile` to patch a built-in material's shader. The node graph is visual sugar over the same math — find what the nodes do mathematically and express that in GLSL.

### "Use a render feature / render pass"

→ Use `EffectComposer` with a custom `ShaderPass`, or use the `pmndrs/postprocessing` library. The concept is the same: render the scene, then apply a full-screen shader to the result.

### "Use a compute shader for..."

→ In WebGL 2, you can't. Do it on the CPU in JavaScript (fine for generation-time computation), or wait for WebGPU support. For procedural building generation, CPU computation is perfectly appropriate.

### "Bake it in the engine's lightmapper"

→ Compute it during generation and store in vertex colors. We have full knowledge of the geometry at generation time — this is actually easier than engine lightmapping.

### "Use the engine's built-in LOD system"

→ Generate LOD variants during the building generation step. Wire them up with `THREE.LOD`. Or simply generate appropriately detailed geometry — at city scale, individual window mullion details don't matter.

### "Use a GBuffer / deferred pass for edge detection"

→ Render the scene twice: once normally, once with `MeshNormalMaterial` or `MeshDepthMaterial` to a `WebGLRenderTarget`. Sample those textures in a post-processing pass for edge detection. This is the standard Three.js workaround for the lack of a G-buffer.

## What the Model Brings vs. What the Renderer Adds

A key question for any 3D art style: how much of the final look comes from the 3D model itself (authored in Blender, Maya, etc.) versus what the game engine or renderer applies at runtime? The answer varies enormously by style, and understanding this split matters for deciding where to invest effort in a procedural pipeline.

### What Lives in the Model

- **Shape and silhouette** — chunky stylized window vs. realistic mullions is a modeling decision.
- **UV layout** — determines how textures map onto surfaces.
- **Vertex colors** — colors baked per-vertex. Many stylized games (Townscaper especially) rely heavily on this. The model carries its own color.
- **Normals** — smooth vs. hard edges are defined in the model data. A flat-shaded look comes from hard normals on every face. Custom normals can fake curvature or flatten lighting.
- **Baked textures** — diffuse color, ambient occlusion, even lighting can be painted into textures. Some styles (hand-painted WoW-style) put almost everything into the diffuse texture, so the model looks correct even with the simplest possible shader.

### What the Renderer Adds at Runtime

- **Lighting and shadows** — same model looks completely different under flat ambient vs. dramatic directional light.
- **Shading model** — the math that turns surface normal + light direction into a pixel color. PBR, toon, flat, matcap — same model, different shader = completely different look.
- **Post-processing** — bloom, outlines, fog, depth of field, color grading. Screen-space effects the model knows nothing about.
- **Environment** — skybox, ground plane, fog color, ambient lighting. Sets the mood.

### The Spectrum

| Style | Where the look lives | Implication |
|---|---|---|
| Hand-painted (classic WoW) | Almost entirely in the model's diffuse texture. The engine just displays it. | Swap engines and it looks nearly the same. High per-asset authoring cost. |
| PBR / realistic | Almost entirely in the renderer. Model provides raw surface properties (albedo, roughness, metalness). | Same model looks dramatically different under different lighting. Renderer does the heavy lifting. |
| **Soft stylized (our target)** | Split. Model provides shape, proportions, vertex colors. Renderer adds toon shading, AO, fog, outlines. | Both sides matter but neither dominates. Good fit for procedural generation. |
| Flat / minimal | Mostly renderer. Simple geometry + unlit solid-color material + fog. | Very little model authoring needed. Style is almost entirely a material + post-processing choice. |

### Why This Matters for Procedural Generation

Since we generate the geometry, we control both sides of the split. This is an advantage:

- Bake AO into vertex colors during generation (free at runtime).
- Assign palette colors per-vertex during generation (no textures needed).
- Control proportions (chunky walls, thick frames) in the generation rules.
- The renderer then only needs a simple toon material + one directional light + fog.

The less we rely on authored textures and complex shaders, the easier the procedural pipeline is. Vertex colors + a simple shading model is the sweet spot — cheap, deterministic, and the generation pipeline controls most of the final look.

## Identifying Tech Behind Browser Games

When looking at browser games for art style inspiration, it helps to know what technology they use, because that determines whether you can learn from their source code or only from their visual output.

### How to Identify the Tech Stack

**Open DevTools (F12) and check:**

| What to look for | Where | Indicates |
|---|---|---|
| `window.__THREE__` in console | Console | Three.js (often exposes version string) |
| JS bundles with `three.module.js` or Three.js class names | Network / Sources tab | Three.js |
| `.wasm` + `.pck` files loading | Network tab | Godot web export |
| `.wasm` + `.data` + `UnityLoader.js` or `Build/` folder | Network tab | Unity WebGL export |
| `playcanvas` in script names or `pc.Application` | Sources tab | PlayCanvas |
| `.wasm` + large data bundle, rare | Network tab | Unreal (uncommon on web) |
| Plain JS modules, no WASM | Network / Sources tab | Native web engine (Three.js, Babylon, custom) |

The short version: `.wasm` + binary data packs = game engine export. Plain JavaScript = native web engine.

### How Game Engine Web Exports Work

When Godot or Unity export to web, the engine compiles its **entire runtime** to WebAssembly. The game's rendering code, physics, scripting — everything runs in the WASM binary. Shaders get compiled to GLSL and sent to WebGL at runtime, but the shader source is generated by the engine's internal pipeline.

Critically: **game engine web exports do NOT use Three.js.** They bring their own renderer compiled to WASM. A Godot web game and a Three.js app both talk to the same WebGL API underneath, but share nothing above that layer.

### Can You Extract Shading Code From Browser Games?

**From native Three.js / JS games — yes, partly.** The JavaScript is in the browser's Sources tab (often minified but formattable). `ShaderMaterial` definitions contain literal GLSL source strings. You can find the materials, post-processing passes, and rendering setup. An AI agent can analyze this and explain what the shaders do. The GLSL is the same language you'd use in your own `ShaderMaterial`, so it's directly reusable in principle (respecting licensing).

**From Godot/Unity web exports — effectively no.** The shaders are generated by the engine's material pipeline, compiled into the WASM binary or packed in data files, and sent to WebGL as machine-generated GLSL at runtime. You can intercept this GLSL using WebGL inspector tools (like Spector.js), but what you get is verbose engine-internal code full of defines and includes — tightly coupled to the engine's rendering pipeline. It's like trying to learn a recipe by reading the assembly code of a food processor. Technically analyzable, but not practically translatable to clean Three.js shader code.

**The better approach for engine-exported games:** don't extract code. Instead, identify the techniques visually — "that's cel-shading with a 3-step ramp and rim lighting and an inverted-hull outline" — and implement those techniques from scratch in Three.js. The rendering techniques are universal; the implementations are engine-specific.

### Where to Find Directly Useful Inspiration

| Source | Why it's useful |
|---|---|
| Three.js examples and showcase (threejs.org) | Same tech stack, source is right there |
| Shadertoy | Pure GLSL experiments. Code translates directly to a Three.js `ShaderMaterial` fragment shader |
| PlayCanvas games | Also native WebGL/JS, similar rendering approach, inspectable source |
| Codrops articles, awwwards.com | Browser-based 3D projects, often Three.js, usually well-documented |
| Game engine web exports | Useful for **visual** inspiration and identifying techniques, but don't try to extract their shader code — reimplement the techniques instead |

## WebGPU and the Future

Three.js has a `WebGPURenderer` with TSL (Three Shading Language) — a JavaScript-based node material system. This is Three.js's answer to visual shader editors, using code composition instead of visual graphs.

WebGPU brings:
- Compute shaders (GPU-side procedural generation)
- Lower per-draw-call CPU overhead
- Storage buffers, indirect rendering

Current status: Chrome supports WebGPU. Safari and Firefox are behind. For now, target WebGL 2 as the baseline. The generation pipeline is renderer-agnostic by design, so switching renderers later won't require rewriting generators.
