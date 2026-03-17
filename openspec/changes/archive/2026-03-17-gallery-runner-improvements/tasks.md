## 1. ShadCN UI Components

- [x] 1.1 Add `src/components/ui/dialog.tsx` — modal dialog component
- [x] 1.2 Add `src/components/ui/input.tsx` — form input component
- [x] 1.3 Add `src/components/ui/separator.tsx` — visual divider component
- [x] 1.4 Add `src/components/ui/sheet.tsx` — sheet/drawer component
- [x] 1.5 Add `src/components/ui/sidebar.tsx` — sidebar layout system with provider, trigger, content, groups, and menu items
- [x] 1.6 Add `src/components/ui/skeleton.tsx` — loading skeleton component
- [x] 1.7 Add `src/components/ui/tooltip.tsx` — tooltip component
- [x] 1.8 Add `src/hooks/use-mobile.ts` — responsive viewport detection hook

## 2. Gallery Shell Refactor

- [x] 2.1 Modify `src/gallery/index.html` — add `class="dark"` to `<html>` tag for dark mode
- [x] 2.2 Modify `src/gallery/gallery-shell.tsx` — replace custom Tailwind layout with ShadCN `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenu` for fixture navigation
- [x] 2.3 Modify `src/gallery/gallery-shell.tsx` — move invariant results from fixed right panel to `Dialog` modal triggered by a button
- [x] 2.4 Modify `src/gallery/gallery-shell.tsx` — float Leva controls panel at top-right of viewport area
- [x] 2.5 Modify `src/gallery/gallery-shell.tsx` — display fixture label in top bar as `stage / label` when labels are available, falling back to `seed X`

## 3. Facade Renderer Migration

- [x] 3.1 Create `src/facade-lab/index.ts` — barrel export for `renderFacade2D`, `ViewMode`, and `FacadeLabView` types
- [x] 3.2 Modify `src/gallery/renderers/facade-renderer.ts` — replace Three.js renderer with 2D canvas renderer using `renderFacade2D` from `@/facade-lab`
- [x] 3.3 Implement facade-to-view conversion: extract first non-party wall from `FacadeResult`, compute element bounds, build element catalog, calculate usable width/bay count/palette
- [x] 3.4 Handle canvas sizing and `ResizeObserver` for responsive viewport updates

## 4. Building Renderer

- [x] 4.1 Create `src/gallery/renderers/building-renderer.ts` — Three.js renderer for `BuildingResult` with colored boxes, floor lines, wall outlines, ground plane, and auto-camera positioning
- [x] 4.2 Modify `src/gallery/renderers/index.ts` — import and register `createBuildingRenderer` in the renderer factory map
- [x] 4.3 Modify `src/gallery/gallery.spec.ts` — set building stage `hasRenderer: true`

## 5. Curated Fixtures & Labels

- [x] 5.1 Modify `src/test-fixtures/types.ts` — add optional `labels?: string[]` field to `GeneratorFixture` type
- [x] 5.2 Modify `src/test-fixtures/facade-fixtures.ts` — replace generic config with `curatedConfigs` map: seed 1 = narrow 3-floor (8m), seed 2 = wide 3-floor (16m), seed 3 = tall 4-floor (10m), seed 4 = low wide (22m, 2-floor), seed 5 = with party wall (10m + 12m)
- [x] 5.3 Modify `src/test-fixtures/facade-fixtures.ts` — update `seeds` array to `[1, 2, 3, 4, 5]` and add matching `labels` array
- [x] 5.4 Modify `src/test-fixtures/facade-fixtures.ts` — add fallback config for unknown seeds
- [x] 5.5 Modify `src/test-fixtures/facade-fixtures.ts` — remove "uses more than one unique window element" invariant (no longer applicable with curated configs)
- [x] 5.6 Modify `src/gallery/gallery.spec.ts` — update facade fixture seeds from `[1, 42, 123, 999]` to `[1, 2, 3, 4, 5]`

## 6. Integration Verification

- [x] 6.1 Run `npm run lint` — all files pass linting
- [x] 6.2 Run `npx vitest run` — all tests pass with curated fixture seeds
- [x] 6.3 Run `npm run dev:gallery` — verify gallery renders with ShadCN sidebar, dark mode, fixture labels, 2D facade rendering, and 3D building rendering
