# Art Direction

Status: durable reference, evolving

## Target Art Style

The working label for our target look is **"soft stylized"** — smooth or gently faceted geometry, muted but warm colors, visible ambient occlusion for depth, minimal or no outlines, and a diorama-like presentation scale.

### What "Soft Stylized" Means Concretely

- **Shading:** smooth-shaded or soft toon (gradient ramp with gentle transitions, not hard cel-shading bands). Lighting should feel warm and slightly simplified — not flat/unlit, but not PBR-realistic either.
- **Geometry:** chunky proportions, slightly exaggerated features (thick window frames, oversized roof overhangs, generous wall depth). Not low-poly-as-aesthetic — the geometry is simplified because buildings are generated, not because we're chasing a faceted look.
- **Color:** palette-restricted, warm and muted. Think Mediterranean pastels, Scandinavian town colors, or Japanese townscape illustration palettes. Each building gets a base color from a curated palette; elements (roofs, trims, doors) derive harmonious accents.
- **Depth cues:** baked ambient occlusion in vertex colors (dark in corners, under overhangs, in window recesses). Subtle fog for atmospheric depth. Hemisphere lighting for natural sky/ground ambient split.
- **Scale feel:** miniature / diorama / tilt-shift. The scene should feel like a charming model, not a 1:1 simulation. A slight depth-of-field effect could reinforce this but is optional.
- **Outlines:** not required for the base look. If added later, they should be subtle (thin, desaturated, geometry-based via inverted hull — not heavy ink lines).

### Reference Games and Projects

These are the primary reference points for the feel we're after, listed in rough order of relevance:

| Reference | What to take from it |
|---|---|
| **Townscaper** | Chunky building proportions, vertex-colored surfaces, baked AO, colorful-but-cohesive palette, water/island presentation environment, diorama feel |
| **Tiny Glade** | Soft ambient lighting, miniature scale, warmth, the feeling that generated output is charming rather than clinical |
| **Monument Valley** | Clean geometry, restricted palette, dramatic but simple lighting, the idea that less detail = more mood |
| **Mini Motorways** | Ultra-clean flat style as a lower bound — proves you can make procedural cityscapes feel good with almost no rendering complexity |

### What We're NOT Going For

- **Photorealism** — no PBR materials, no realistic textures, no film-grain grunge.
- **Hard cel-shading** — no Borderlands-style black outlines + flat color bands. Too graphic, too noisy at city scale.
- **Pixel art / retro 3D** — charming but a very different aesthetic direction.
- **Hyper-detailed hand-painted textures** — too much per-asset authoring work, doesn't fit a procedural system.
- **Dark/gritty/cyberpunk** — the tone should be warm, inviting, toylike.

## Art Style Vocabulary

When describing the visual style in specs, code comments, or conversations with AI agents, use these terms consistently:

### Shading Terms

| Term | Meaning |
|---|---|
| Flat-shaded | One color per face, no normal interpolation. Faceted look. |
| Smooth-shaded | Interpolated normals. Smooth surface. |
| Cel-shaded / toon-shaded | Lighting quantized into hard discrete bands (2-4 steps). |
| Soft toon | Like cel-shading but with blurred band transitions. |
| Unlit / emissive | No response to lights; constant color. |
| Matcap-shaded | Lighting baked into a sphere-captured texture image. No scene lights needed. |
| Stylized PBR | Realistic shading model with non-realistic textures/colors. |

### Geometry Terms

| Term | Meaning |
|---|---|
| Low-poly | Intentionally reduced polygon count as an aesthetic. |
| Chunky | Exaggerated proportions — thick walls, oversized features. |
| Faceted | Flat-shaded with visible polygon faces as the intentional look. |
| Beveled / chamfered | Edges softened with small connecting faces. Adds polish. |

### Color & Texture Terms

| Term | Meaning |
|---|---|
| Solid color / flat color | One color per element, no texture map. |
| Vertex-colored | Color stored per-vertex, interpolated across faces. |
| Palette-restricted | Limited curated set of colors (8-32). Gives cohesion. |
| Gradient-mapped | Colors looked up from a gradient (e.g., height to color). |
| Texture atlas | Multiple element textures packed into one image. |
| Triplanar mapping | Texture projected from three axes — no UV unwrapping needed. |

### Lighting & Atmosphere Terms

| Term | Meaning |
|---|---|
| Baked AO | Ambient occlusion computed at generation time, stored in vertex colors. |
| Rim lighting / fresnel | Edge glow where surface faces away from camera. |
| Hemisphere lighting | Sky-color / ground-color ambient blend. |
| Tilt-shift | Depth-of-field that makes scenes look miniature. |
| Fog / atmosphere | Depth-based color fade for spatial depth. |

### Composite Style Labels

These are shorthand labels that combine multiple techniques into a recognizable look:

| Label | Description | Examples |
|---|---|---|
| "Clean toon" | Cel-shading + outlines + flat colors | Borderlands, Jet Set Radio |
| **"Soft stylized"** | Smooth-shaded, muted colors, baked AO, warm lighting | Townscaper, Tiny Glade |
| "Minimal flat" | Unlit, solid colors, clean geometry | Mini Motorways, Monument Valley |
| "Chunky low-poly" | Low poly count, flat-shaded, saturated colors | Crossy Road |
| "Stylized PBR" | Realistic shading with exaggerated textures | Fortnite, Overwatch |
| "Hand-painted" | Textures with visible brush strokes, baked lighting | World of Warcraft (classic) |

Our target is **"soft stylized"** — the second row.

## Color Palette Philosophy

The palette should be a first-class input to the generation pipeline, not something baked into shaders or renderer code.

### Principles

- A palette is a small structured object: base wall colors (5-10 options), roof colors (3-5), trim/accent colors (3-5), ground/environment colors (2-3).
- Each generated building draws from the palette deterministically based on its seed.
- Accent colors (doors, shutters, awnings) should contrast with but harmonize against the wall color.
- Variation comes from the palette, not from randomness — if two buildings share a wall color, their trim colors can still differ.

### Initial Palette Direction

Think warm Mediterranean or Scandinavian coastal town:
- Walls: warm whites, pale yellows, terracotta, dusty pink, soft blue-gray
- Roofs: terra cotta red, slate gray, dark brown, moss green
- Trims: cream, dark brown, charcoal, muted blue
- Ground: warm gray stone, sandy beige
- Sky/fog: pale warm blue fading to haze

This is a starting point. Multiple palettes should be swappable as a single generation parameter.

## Reference Images

Place reference images, screenshots, and mood boards in the `references/` subdirectory. Name files descriptively:

```
references/townscaper-color-palette.png
references/mediterranean-village-ref.jpg
references/soft-toon-shading-example.png
```

Reference images are for human consumption — they help communicate intent that words alone can't capture. They are not inputs to the generation pipeline.

## Web / Three.js Reference Projects

| Link | What it shows | Notes |
|---|---|---|
| [Vibe-coded naval combat game (Reddit)](https://www.reddit.com/r/aigamedev/comments/1rfk9h3/i_vibecoded_a_multiplayer_naval_combat_game_and/) | Realistic water in a vibe-coded Three.js game | Good example of water rendering quality achievable in Three.js. Relevant if we do anything with water and island presentation environments. |
| [3D architectural playground of the world (Reddit)](https://www.reddit.com/r/threejs/comments/1rtywm0/3d_architectural_playground_of_the_world/) | 3D architecture visualization in Three.js | Architectural/urban scene built with Three.js — relevant as a direct example of buildings in the browser. |
| [Anime water shader — free resource (Reddit)](https://www.reddit.com/r/threejs/comments/1rsq1cs/anime_water_shader_free_resource/) | Stylized anime-style water shader for Three.js | Free resource for stylized water rendering. Relevant for island presentation and as an example of stylized (non-realistic) water that fits a soft/toon aesthetic. |
| [Three.js creators at GDC — "we're cooking" (Reddit)](https://www.reddit.com/r/threejs/comments/1rp23pj/threejs_creators_at_gdc_or_not_were_cooking/) | Three.js ecosystem direction and capabilities showcase | Shows what the Three.js community is pushing toward — useful for gauging where the platform is headed. |
| [Stylized shader work (Reddit)](https://www.reddit.com/r/threejs/comments/1r3le8h/worked_on_this_between_projects_stylized_shader/) | Stylized shader techniques in Three.js | Demonstrates stylized/toon shading in Three.js. Directly relevant to our "soft stylized" target aesthetic. |
| [Simple home builder (Reddit)](https://www.reddit.com/r/threejs/comments/1rcbacj/building_a_simple_home_builder/) | Procedural home/building construction tool in Three.js | A building builder in the browser — closely related to our project's domain. Worth studying for UX and generation approach. |
| [Oceanic Pharos — immersive 3D sanctuary (Reddit)](https://www.reddit.com/r/threejs/comments/1rldz04/oceanic_pharos_an_immersive_3d_sanctuary/) | Immersive ocean/lighthouse 3D scene in Three.js | Atmospheric ocean environment with architecture. Relevant for water + structure composition and mood/lighting reference. |
| [3D terrain editor + day/night system (Reddit)](https://www.reddit.com/r/threejs/comments/1qqhp4l/3d_terrain_editor_daynight_system_in_the_browser/) | Terrain editing and day/night cycle in the browser | Relevant for terrain/environment around buildings and lighting variation. Shows that dynamic time-of-day is feasible in Three.js. |
| [Stylized building generation thread (@alightinastorm)](https://x.com/alightinastorm/status/2033008419443998796) | Stylized procedural building visuals | Twitter/X thread with visual reference for stylized building generation. Directly relevant to our art direction. |
| [Trident — vibe-stack (GitHub)](https://github.com/vibe-stack/trident) | Trident game framework / toolkit | Part of the vibe-stack ecosystem. Worth watching for patterns in browser-based game tooling and rendering approaches. |
| [Elanra Studios post (X)](https://x.com/ElanraStudios/status/1965415480669393133) | — | — |
| [Cannon Clash (CrazyGames)](https://www.crazygames.com/game/cannon-clash-yoo) | — | — |
| [Poki Action Games](https://poki.com/en/action) | — | — |
| [Jelly Slider in TypeGPU (Reddit)](https://www.reddit.com/r/webgpu/comments/1otbsu5/jelly_slider_in_typegpu/) | — | — |

## Technique Notes

### Water & Island Presentation

The north star scene is an island-like bounded environment with buildings. Water rendering is not a priority for the generation pipeline but matters for the final presentation. The Reddit naval combat link above shows that convincing water is achievable in Three.js with vibe-coding alone — no engine needed.

### Toon Shading Approach

Starting point: `MeshToonMaterial` with `LinearFilter` gradient map (soft transitions). See `threejs-rendering-guide.md` for details.

### Ambient Occlusion

Primary strategy: bake AO into vertex colors during generation. Free at runtime, deterministic, controlled. SSAO as optional supplement only.

## Mood & Vibe Notes

- Should feel like picking up a snow globe or looking at a model train set
- Warm, inviting, toylike — never dark or gritty
- Variation should feel curated, not random
- "Charming" is the word — generated output should make you smile, not squint

## Open Questions

- How far can vertex colors + soft toon shading go before we need textures?
- What's the minimum water rendering that still looks good for the island presentation?
- Do we want outlines? If so, inverted hull (geometry-based) is the preferred approach.
- How does time-of-day / lighting variation interact with the palette system?
