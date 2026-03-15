# Why Web, Not a Game Engine

Status: durable reference

## The Decision

This project uses Three.js in the browser rather than a conventional game engine (Godot, Unity, Unreal). This document captures the reasoning.

## Context

The primary goal of this project is to explore agentic development in a 3D procedural generation context: manipulating 3D objects, building algorithms for procedural generation, experimenting with structure and concepts. The specific renderer is secondary. The ideal outcome is that the documentation, specs, and architectural decisions are general enough that an agent could implement them for Unreal (C++), Godot (GDScript), or the web (TypeScript/Three.js).

## Agentic Development — The Deciding Factor

Agentic development capability is the top priority, and the web/TypeScript environment is the most agent-friendly development context available:

- **Everything is text.** No binary scene files, no project files that need a GUI to edit, no proprietary formats. An agent can read and write every file in the project.
- **Iteration is instant.** Save a file, the browser reloads. No compile step, no engine restart.
- **Testing is mature.** Vitest for logic tests, Playwright for browser and screenshot verification. Agents can verify their own work without looking at a screen.
- **Tooling depth.** AI models have seen more TypeScript/JavaScript than any other language. Suggestions are better, error diagnosis is more reliable, API hallucinations are rarer.

### Game Engine Comparison

**Godot** is the most agent-friendly game engine (text-based `.tscn` files, simple GDScript), but "most agent-friendly game engine" is still meaningfully worse than the web:

- Headless/CLI testing is possible but clunkier than `vitest run`.
- GDScript is a niche language. AI models know it with far less depth than TypeScript, leading to more hallucinations and wrong API calls.
- Scene composition still heavily assumes the editor GUI. Agents *can* write `.tscn` files by hand, but it fights the tool rather than flowing with it.
- Debugging is harder to automate — no equivalent of browser DevTools for quick inspection.

**Unity** (C#) has better language model coverage than Godot, but is heavily GUI-dependent and has licensing considerations.

**Unreal** (C++) has the worst agent ergonomics: massive codebase, slow compilation, deeply GUI-dependent workflows.

## Visual Quality — Valid Concern, Manageable

The target art style ("soft stylized", Townscaper/Tiny Glade territory) is one of the most achievable styles in Three.js:

- It does not rely on complex global illumination or compute shaders (where Three.js genuinely falls behind game engines).
- The core approach is vertex colors + toon shading + post-processing (AO, fog, optional outlines). All of this works well in Three.js.
- Because the generation pipeline controls the geometry, visual quality can be baked into the mesh itself (smooth normals, vertex AO, proportions) rather than depending on advanced renderer features.

The honest gap between Three.js and a game engine is **convenience, not capability**. A game engine provides shader editors, built-in post-processing stacks, and easier material tweaking out of the box. In Three.js you write the same math by hand. The end result can look the same; the path to get there has more friction.

Where Three.js would genuinely hit limits: dynamic global illumination, volumetric lighting, GPU compute particle systems, physically-based destruction. None of these are in the current art direction.

## The Architecture Makes This Reversible

The system is designed as "browser first, engine portable." The generation pipeline emits engine-neutral data contracts:

```
plots -> massing -> facade decomposition -> element selection -> style assignment -> building assembly
```

The Three.js renderer is a thin visualization layer that consumes these contracts. If the project later moves to a game engine (especially if it evolves toward an actual game), the migration path is clear:

- **Generation pipeline** (the hard, interesting part) — stays as-is or ports directly. The algorithms are language-agnostic.
- **Data contracts** (JSON) — consumed directly by a game engine scene builder.
- **Renderer** (Three.js) — replaced entirely by the engine's scene tree and materials.

The generation logic is where agents add the most value. The renderer is plumbing. Renderer choice should not drive the architecture.

## Transferable Learning

TypeScript procedural generation algorithms teach patterns that transfer to any language and any engine. GDScript algorithms do not transfer as broadly. Since a core goal is learning how to structure and approach procedural generation with agents, the web provides more transferable outcomes.

## Summary

| Dimension | Web / Three.js | Game Engine (Godot) |
|---|---|---|
| Agentic development | Best available | Workable but worse |
| AI model quality | Deep TypeScript coverage | Shallow GDScript coverage |
| Testing automation | Mature (Vitest, Playwright) | Possible but clunky |
| Iteration speed | Instant (hot reload) | Slower (engine restart) |
| Target art style | Achievable | Easier tooling |
| Portability | Architecture already handles it | Would need same architecture |
| Path to actual game | Harder, would need migration | Native |
| Transferable learning | High (TypeScript is universal) | Lower (GDScript is niche) |

The tension — "will it look good enough?" — is a concern about the last 20% of visual polish, not the first 80% of the generation system. If a genuine visual ceiling is reached, the architecture supports swapping the renderer without losing the generation work.
