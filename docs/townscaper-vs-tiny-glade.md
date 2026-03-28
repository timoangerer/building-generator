# Townscaper vs Tiny Glade: Technical Comparison

Research notes comparing two procedural building games and what their approaches mean for this project.

## Bottom Line

Townscaper and Tiny Glade solve a similar user problem with very different technical philosophies.

- **Townscaper** is mostly a discrete, hidden-grid, rule-solver system. The player edits occupancy on an irregular cell grid, and the game resolves architecture from local constraints.
- **Tiny Glade** appears to be a continuous, tool-driven, contextual modeling system. The player sketches walls, paths, roofs, stairs, etc., and multiple generators reshape geometry, supports, openings, and detail in response.

Some of Tiny Glade's exact internals are not public, so parts of the analysis below are inference from official descriptions and developer interviews.

---

## Townscaper

Confirmed from Oskar Stalberg's interview coverage and the Steam page:

- The player places colored blocks on an irregular grid, not freeform geometry.
- The irregular grid is deliberate: Stalberg describes it as an irregular relaxed quadrilateral grid derived from ideas he explored earlier for city rendering.
- Townscaper combines three ideas:
  - Irregular quad grid generation
  - A real-time Wave Function Collapse-like constraint system to choose valid modules
  - A marching-cubes-like corner meshing approach so modules fit the irregular cells
- When you add or remove a block, the connected structure re-evaluates. Large edits ripple through the whole connected area.
- Decoration is a second pass after structural resolution. That includes windows, props, gardens, stairs, statues, and other "recipes".
- The system is tuned so large shapes are predictable for the player, while small details vary.
- Some details are handled outside the main modules. Example: windows are cut after placement with a stencil-buffer approach, instead of being baked into every tile variant.

### Architectural takeaway

Townscaper is fundamentally a **semantic occupancy editor over a non-rectilinear grid**. The generator is mostly "choose legal local modules for this topology, then decorate".

---

## Tiny Glade

Confirmed from official store/news text and direct developer interviews:

- It started as a procedural wall generator.
- The game is described officially as "gridless building chemistry".
- The public store description says the game assembles bricks, pebbles, planks, doors, supports, beams, etc. in response to user edits like drawing paths through buildings or raising structures.
- The devs explicitly say it is **not one big algorithm**. It is many generators/pipelines, each tailored to a specific element and behavior.
- Their engine stack is a modified Bevy base plus a custom Vulkan/rendering pipeline, because they needed compute shaders and more GPU-side control for generation/rendering.
- Bridges forced them to evolve from a mostly 2D terrain-bound system into a more 3D support-aware one.
- On May 18, 2025, they said stairs were their biggest post-launch change and required reworking object generation, attachment, and bookkeeping.
- On July 29, 2025, the released stairs system was described as node-based, able to become stairs/platforms/ladders depending on steepness, attach to walls/flat roofs, and automatically route around towers.
- For windows, Anastasia Opara described one setup using a float vertex attribute encoding signed distance to windows, which they use for plaster damage and window blending behavior.

### What that strongly suggests

Tiny Glade is closer to a **parametric relational editor** than a tile solver. The core unit is probably not "cell occupancy" but editable shapes/primitives plus contextual rules:

- Wall strokes
- Roof/building volumes
- Path splines/areas
- Supports/attachments
- Terrain relationships
- Local mesh deformation and replacement

The system likely answers questions like:

- What does this wall become if intersected by a path?
- When does a window become a door?
- What support geometry is needed if this mass is elevated?
- How should stairs attach and wrap around nearby structures?

---

## Key Difference

If you want a clean mental model:

| | Townscaper | Tiny Glade |
|---|---|---|
| **Core approach** | Topology-first, solver-first | Interaction-first, tool-first |
| **Grid** | Hidden irregular grid | Gridless |
| **Assembly** | Module assembly | Contextual remeshing/deformation |

- Townscaper is closer to procedural architecture from **adjacency rules**.
- Tiny Glade is closer to procedural architecture from **direct manipulation plus local semantic reactions**.

---

## Relevance to This Project

For the kind of generator we're building, the useful hybrid is probably:

- **Townscaper-like approach** for plot, block, bay, facade rhythm, enclosure, and "recipes" that should be deterministic and learnable.
- **Tiny Glade-like approach** for direct editing tools on top of that: walls, courtyards, paths, bridges, stairs, supports, openings, terrain-following attachments.

This fits the repo's core principles:

- Semantic before geometric
- Deterministic inspectable generation
- Rules over one-offs
- Browser-first but engine-portable

---

## Sources

- [Townscaper on Steam](https://store.steampowered.com/app/1291340/Townscaper/)
- [How Townscaper Works: A Story Four Games in the Making](https://www.gamedeveloper.com/game-platforms/how-townscaper-works-a-story-four-games-in-the-making)
- [Tiny Glade official page](https://pouncelight.games/tiny-glade/)
- [Tiny Glade on Steam](https://store.steampowered.com/app/2198150/Tiny_Glade/)
- [Tiny Glade Steam community page](https://steamcommunity.com/app/2198150)
- [Tiny Glade developers interview on 80.lv](https://80.lv/articles/exclusive-tiny-glade-developers-discuss-bevy-proceduralism-publishers-cozy-games)
- [Tiny Glade procedural windows article on 80.lv](https://80.lv/articles/procedural-windows-in-pounce-light-s-tiny-glade-get-an-upgrade/)
- [Tiny Glade news / stairs update](https://steamcommunity.com/app/2198150/allnews/)
- [Graphics Programming Conference 2024 archive](https://www.graphicsprogrammingconference.nl/archive/2024/)
