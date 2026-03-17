## Why

The gallery runner — the visual test harness for inspecting generator outputs across pipeline stages — has several issues that reduce its usefulness as a verification tool:

1. **Broken facade rendering**: The 3D Three.js facade renderer doesn't properly display facades, making visual facade inspection impossible in the gallery
2. **No building stage visualization**: The building stage has no renderer, so the gallery can't display complete building assembly results
3. **Generic fixture seeds**: All facade seeds use the same wall/floor configuration, so browsing seeds shows near-identical results instead of meaningful architectural variation
4. **Rigid layout**: The custom Tailwind flexbox layout lacks proper sidebar navigation, responsive behavior, and dark mode support

## What Changes

- **Gallery shell → ShadCN/ui**: Replace the custom Tailwind layout with ShadCN Sidebar, Dialog, and TooltipProvider components. Enable dark mode via `class="dark"` on the HTML root. Move invariant results into a modal dialog. Float Leva controls at top-right of viewport
- **Facade renderer → 2D canvas**: Replace the broken Three.js facade renderer with a 2D canvas renderer that reuses `renderFacade2D` from the facade-lab module, converting facade results to `FacadeLabView` format
- **New building renderer**: Add a Three.js building renderer that displays `BuildingResult` as colored boxes with floor lines, wall outlines, ground plane, and auto-positioned camera
- **Curated facade fixtures**: Replace generic seeds `[1, 42, 123, 999]` with curated seeds `[1, 2, 3, 4, 5]` mapped to distinct wall configurations (narrow 3-floor, wide 3-floor, tall 4-floor, low wide 2-floor, party wall)
- **Fixture labels**: Extend `GeneratorFixture` type with optional `labels?: string[]` field for descriptive seed names displayed in the gallery sidebar and top bar
- **Facade-lab public API**: Export `renderFacade2D`, `ViewMode`, and `FacadeLabView` from `src/facade-lab/index.ts` so the gallery facade renderer can reuse the 2D rendering logic

## Capabilities

### Modified Capabilities
- `gallery-viewer`: ShadCN/ui shell with dark mode, sidebar navigation, dialog-based invariant display, fixture label rendering, Leva controls floating in viewport
- `test-fixtures`: `GeneratorFixture` type gains optional `labels` field; facade fixtures use curated seed-to-config mappings with descriptive labels
- `facade-lab`: Public API barrel export for `renderFacade2D`, `ViewMode`, `FacadeLabView`

## Impact

- **New files**: `src/components/ui/{dialog,input,separator,sheet,sidebar,skeleton,tooltip}.tsx`, `src/hooks/use-mobile.ts`, `src/gallery/renderers/building-renderer.ts`, `src/facade-lab/index.ts`
- **Modified files**: `src/gallery/gallery-shell.tsx` (ShadCN layout), `src/gallery/index.html` (dark mode), `src/gallery/renderers/facade-renderer.ts` (2D canvas), `src/gallery/renderers/index.ts` (building renderer registration), `src/gallery/gallery.spec.ts` (curated seeds), `src/test-fixtures/facade-fixtures.ts` (curated configs + labels), `src/test-fixtures/types.ts` (labels field)
