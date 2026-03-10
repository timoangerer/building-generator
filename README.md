# green-buses-cross

Minimal TypeScript workspace for a browser-based facade workbench, organized so the pure layout engine stays separate from 2D and 3D adapters.

## Workspace layout

```text
apps/
  workbench/        Vite app shell for editing and previewing facades
packages/
  facade-core/      facade types, presets, layout engine, verification exports
  facade-svg/       2D SVG renderer/exporter
  facade-three/     Three.js preview scene
```

## Why this shape

- `facade-core` is pure domain logic and can be reused by tests, tools, and future generators.
- `facade-svg` and `facade-three` are thin adapters over the resolved layout contract.
- `apps/workbench` stays simple: vanilla TypeScript plus Vite, no framework overhead until the project actually needs it.
- npm workspaces are enough for the current size and keep dependency management straightforward.

This is the intended stack direction for more web 2D/3D work:

- TypeScript everywhere
- npm workspaces for the monorepo
- Vite for the browser app
- Three.js for 3D previews
- SVG for lightweight 2D elevation output

## Commands

Install dependencies:

```bash
npm install
```

Run the workbench:

```bash
npm run dev
```

Typecheck all workspaces:

```bash
npm run typecheck
```

Build the app:

```bash
npm run build
npm run preview
```

The dev server runs on `http://localhost:3000` and preview stays on `http://localhost:4173`.

## Facade JSON

Each facade still uses the same wall-first structure:

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
- If a row would overflow horizontally, the layout engine scales the row proportionally instead of distorting one item.
