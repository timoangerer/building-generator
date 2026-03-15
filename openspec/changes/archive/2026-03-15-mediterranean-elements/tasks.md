## 1. Extend Contracts

- [x] 1.1 Add `GeometryPart` type with shape discriminant (`"box"` | `"cylinder"` | `"half_cylinder"`), per-shape dimensions, `role` string, and `position` (Vec3) to `src/contracts/element.ts`
- [x] 1.2 Add `"composite"` variant to `ElementGeometry` union: `{ type: "composite", parts: GeometryPart[] }`
- [x] 1.3 Add `ColorPalette` type (record of role string to hex color number) to `src/contracts/element.ts`
- [x] 1.4 Add `defaultPalette: ColorPalette` field to `ElementCatalog` type
- [x] 1.5 Update `src/contracts/element.schema.ts` with Zod schemas for `GeometryPart`, composite `ElementGeometry`, `ColorPalette`, and updated `ElementCatalog`
- [x] 1.6 Update barrel exports in `src/contracts/index.ts`

## 2. Build Mediterranean Element Catalog

- [x] 2.1 Implement composite geometry builders: helper functions to construct box, cylinder, and half-cylinder `GeometryPart` objects with role and position
- [x] 2.2 Build 5 window elements: `window-tall`, `window-arched`, `window-shuttered`, `window-arch-shut`, `window-small-sq`
- [x] 2.3 Build 2 door elements: `door-arched`, `door-paneled`
- [x] 2.4 Build 2 balcony-door elements: `balcony-door-iron` (French door + thin slab + iron railing), `balcony-door-stone` (French door + thick slab + stone balustrade)
- [x] 2.5 Define default Mediterranean color palette mapping roles (pane, frame, shutter, sill, panel, railing, slab, arch) to hex colors
- [x] 2.6 Wire catalog and palette into `generateElementCatalog` in `src/generators/element/element-generator.ts`

## 3. Update Element Generator Tests

- [x] 3.1 Update `element-generator.test.ts`: verify catalog contains all 9 element IDs
- [x] 3.2 Add test: composite elements have expected roles (shuttered windows have "shutter" role parts, arched elements have half_cylinder parts)
- [x] 3.3 Add test: default palette covers every role used across all elements
- [x] 3.4 Add test: deterministic output (same seed → same catalog)
- [x] 3.5 Add test: catalog passes updated Zod schema validation

## 4. Update Workbench Renderer

- [x] 4.1 Add composite geometry mesh builder: given a composite `ElementGeometry`, create Three.js geometries for each part (BoxGeometry, CylinderGeometry with thetaLength for half_cylinder) positioned at part offsets
- [x] 4.2 Implement per-(elementId, role) InstancedMesh grouping: group placements by elementId, then create one InstancedMesh per role within each element
- [x] 4.3 Apply palette colors: look up each role's color from `defaultPalette` and assign to the InstancedMesh material
- [x] 4.4 Ensure box-geometry elements still render correctly (backward compatibility)
- [x] 4.5 Verify rendering in the workbench — elements should show distinct shapes and role-based colors on building facades
