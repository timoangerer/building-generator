# building-generator

Vite-based browser prototype for procedural 3D buildings with:

- random rectilinear plot generation (`square`, `rectangle`, `L`, `H`, `O`, courtyard)
- plot extrusion into a 3D massing model
- a facade JSON/DSL with zones, rows, repeat-fit items, and ornaments
- per-side facade editing for `north`, `east`, `south`, `west`, and `inner` walls
- placeholder 3D architectural elements made from primitives

## Run

Install dependencies, start the dev server, then open the printed URL:

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:3000` and preview stays on `http://localhost:4173`.

## Build

```bash
npm run build
npm run preview
```

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
