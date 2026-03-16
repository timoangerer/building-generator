## Why

The building generator produces cities but renders them in a dark void. The art direction calls for a Townscaper-style island/water/diorama presentation, and references like Dragon Quest XI show that HD-stylized environments (semi-realistic water, painterly skies, lush terrain) are achievable and compelling in real-time. Before committing to a single environment approach for the main workbench, we need a scratchpad to prototype, compare, and document different water, sky, and terrain techniques side-by-side in the browser.

## What Changes

- **New `src/env-lab/` module**: A self-contained experimentation space for environment rendering approaches, completely independent from the main workbench and generation pipeline
- **Swappable environment layers**: Each water, sky, and terrain approach is a separate module implementing a common interface, hot-swappable at runtime
- **Preset system**: Named combos (water + sky + terrain + fog settings) for quick comparison
- **Separate dev command**: `dev:env-lab` launches a standalone Three.js viewer with a control panel for switching approaches and tweaking parameters
- **Fog as preset property**: Fog config (type, color, near/far) is part of each preset rather than a standalone layer — it's the glue that makes combos feel cohesive

## What Does NOT Change

- The main workbench (`src/workbench/`) is untouched
- The generation pipeline and contracts are untouched
- No buildings are rendered in the env-lab (flat plateau center is reserved for future placement)
- This is a scratchpad — no stable interface contract with the main workbench

## Capabilities

### New Capabilities
- `env-lab-water`: Multiple swappable water rendering approaches (flat sine waves, custom stylized shader, Three.js Ocean)
- `env-lab-sky`: Multiple swappable sky rendering approaches (gradient, hemisphere dome, atmospheric)
- `env-lab-terrain`: Multiple swappable island terrain approaches (plateau + noise falloff, layered strata, smooth slope with zones)
- `env-lab-viewer`: Standalone Three.js viewer with ShadCN/Tailwind control panel for live switching and parameter tweaking

## Impact

- **New files only** — no modifications to existing code
- **New Vite entry point** (`src/env-lab/viewer/main.tsx`) with its own HTML and config
- **New dev script** in `package.json`: `"dev:env-lab"`
- **No new dependencies expected** — Three.js already available; Three.js example imports (`Water`, `Sky`) come from `three/examples/jsm/`
