# building-generator

Static browser prototype for procedural 3D buildings with:

- random rectilinear plot generation (`square`, `rectangle`, `L`, `H`, `O`, courtyard)
- plot extrusion into a 3D massing model
- a facade JSON/DSL with zones, rows, repeat-fit items, and ornaments
- a normalized asset-library layer that maps facade semantics onto source-kit parts
- per-side facade editing for `north`, `east`, `south`, `west`, and `inner` walls
- placeholder 3D architectural elements made from primitives

## Run

Install dependencies and run the Vite dev server:

```bash
npm install
npm run dev
```

Then open the printed local URL, typically `http://127.0.0.1:4174`.

## Workbench views

The app now lands on a workbench home and exposes separate front-end tool views:

- `Workbench`: landing page with available tools
- `3D Viewer`: massing and facade-assignment scene without the JSON editor
- `Facade Editor`: the current building scene plus live facade JSON editing
- `Asset Library`: normalized kit browser with a dedicated asset preview scene

## Asset kits

The prototype now expects each source kit to have a sidecar manifest. The starter Venice kit lives at [assets/Venice modular building parts/kit.json](/Users/timoangerer/devel/games/worktrees/cold-crabs-repeat-8pg/assets/Venice modular building parts/kit.json), and the adapter that normalizes it lives at [asset-kits/venice-modular-building-parts.js](/Users/timoangerer/devel/games/worktrees/cold-crabs-repeat-8pg/asset-kits/venice-modular-building-parts.js).

The facade DSL can stay semantic and optionally add `assetQuery` hints:

```json
{
  "type": "window",
  "repeatFit": true,
  "minWidth": 1.4,
  "maxWidth": 1.95,
  "assetQuery": {
    "role": "window",
    "tags": ["lintel", "wide"]
  }
}
```

The normalization contract is documented in [docs/asset-library-architecture.md](/Users/timoangerer/devel/games/worktrees/cold-crabs-repeat-8pg/docs/asset-library-architecture.md).

## Facade structure

Each facade is JSON with this shape:

```json
{
  "name": "Classical",
  "zones": [
    {
      "key": "ground",
      "height": 4.4,
      "rows": [
        {
          "height": 1,
          "items": [
            { "type": "door", "minWidth": 1.8, "maxWidth": 2.4 },
            { "type": "window", "repeatFit": true, "minWidth": 1.5, "maxWidth": 2.1, "gap": 0.65 }
          ]
        }
      ],
      "ornaments": [{ "type": "cornice", "size": 0.32, "offsetY": 4.25 }]
    },
    {
      "key": "middle",
      "flex": 1,
      "rows": [
        {
          "repeatFloors": true,
          "heightPerFloor": 3.25,
          "items": [
            { "type": "window", "repeatFit": true, "minWidth": 1.4, "maxWidth": 1.95, "gap": 0.65 }
          ]
        }
      ]
    }
  ]
}
```

Key layout rules:

- `height` reserves exact meters in a zone, `flex` shares remaining wall height.
- `repeatFloors` slices a row into as many floor bands as fit the zone height.
- `repeatFit` packs items across the wall while preserving sensible width bounds.
- if a row would overflow horizontally, the layout engine scales the row proportionally instead of distorting one item.
