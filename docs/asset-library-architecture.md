# Asset Library Architecture

## Decision

The facade generator should not reference raw filenames from a kit directly. It should request semantic building parts such as `door`, `window`, `oculus`, or `cornice`, and a kit-specific adapter should translate a source export into a normalized catalog that the facade system can query.

This keeps the facade DSL stable while allowing multiple source kits with different naming conventions.

## Flow

1. Source kit files live in a folder such as [assets/venice_modular_building_parts](/Users/timoangerer/conductor/workspaces/building-generator/jerusalem/assets/venice_modular_building_parts).
2. A small source-specific adapter uses a build-time glob to discover those files and normalizes them into a common part record shape.
3. The facade renderer asks the asset library for the best matching semantic part for each facade item.
4. Rendering uses the normalized dimensions, anchor, and correction metadata. Today that drives a proxy. Later it can drive real mesh loading with the same contract.

## Normalized Part Contract

Each part record should provide:

- `id`: stable identifier inside the kit
- `role`: semantic type such as `window`, `door`, `oculus`, `cornice`
- `variant`: human-scale distinction such as `a-004` or `big-001`
- `noun`, `family`, `variantCode`, optional `instance`: parsed filename structure for inventory and debugging
- `tags`: extra matching signals such as `arched`, `classical`, `wide`
- `dimensions`: normalized meters after source understanding
- `anchor`: placement contract for facade attachment
- `correction`: source-to-house orientation and uniform scale fix
- `sourceName` and optional `sourcePath`: traceability back to the export

## House Standard

All normalized parts should target this standard:

- Units: meters
- Axes: `+X` right across the facade, `+Y` up, `+Z` outward from the wall
- Openings: origin at bottom-center on the facade plane
- Centered openings such as oculi: origin at geometric center on the facade plane
- Span ornaments: origin at center on the facade plane

This means source kits can remain inconsistent as long as their adapter records the correction needed to reach this standard.

## Why Build-Time Discovery

This prototype runs as a static browser app. In that environment, the client cannot reliably enumerate files in a directory at runtime. The Venice kit therefore uses a Vite glob, which expands at build time and produces a stable file manifest the browser can consume.

If we later need richer metadata, we can still add a checked-in sidecar override or a generated manifest. The runtime contract does not need to change.

## Next Step For Real Meshes

When the real exported meshes are ready, extend the normalized part record with `sourcePath` and add a mesh cache that:

- loads a mesh once per part id
- applies the recorded correction transform
- measures or trusts the normalized bounds
- clones the normalized mesh into each facade slot

The current resolver and facade-side asset queries can remain unchanged.
