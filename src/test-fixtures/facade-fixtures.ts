import { FacadeResultSchema } from "@/contracts";
import { generateFacade } from "@/generators/facade";
import { generateElementCatalog } from "@/generators/element";
import { computeElementBounds } from "@/core-geometry";
import { isFiniteCoord } from "@/test-utils";
import type { FacadeConfig, FacadeResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

const catalog = generateElementCatalog({ seed: 1 });

export const facadeFixture: GeneratorFixture<FacadeConfig, FacadeResult> = {
  name: "generateFacade",
  stage: "facade",
  generator: generateFacade,
  schema: FacadeResultSchema,
  configFactory: (seed): FacadeConfig => ({
    seed,
    walls: [
      {
        buildingId: "b1",
        wallIndex: 0,
        start: { x: 0, z: 0 },
        end: { x: 10, z: 0 },
        height: 9,
        length: 10,
        normal: { x: 0, z: -1 },
      },
      {
        buildingId: "b1",
        wallIndex: 1,
        start: { x: 10, z: 0 },
        end: { x: 10, z: 15 },
        height: 9,
        length: 15,
        normal: { x: 1, z: 0 },
      },
      {
        buildingId: "b1",
        wallIndex: 2,
        start: { x: 10, z: 0 },
        end: { x: 10, z: 15 },
        height: 9,
        length: 15,
        normal: { x: 1, z: 0 },
        neighborBuildingId: "b2",
      },
      {
        buildingId: "b2",
        wallIndex: 0,
        start: { x: 20, z: 0 },
        end: { x: 30, z: 0 },
        height: 12,
        length: 10,
        normal: { x: 0, z: -1 },
      },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
    availableElements: catalog.elements,
    bayWidth: 2.5,
    edgeMargin: 0.5,
  }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "party walls have empty placements",
      check: (r) =>
        r.facades.every((f) => {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === f.buildingId && w.wallIndex === f.wallIndex,
          );
          if (wall?.neighborBuildingId) {
            return f.placements.length === 0;
          }
          return true;
        }),
    },
    {
      name: "all placements reference valid element IDs",
      check: (r) => {
        const validIds = new Set(
          r.config.availableElements.map((e) => e.elementId),
        );
        return r.facades.every((f) =>
          f.placements.every((p) => validIds.has(p.elementId)),
        );
      },
    },
    {
      name: "all placement coordinates are finite",
      check: (r) =>
        r.facades.every((f) =>
          f.placements.every(
            (p) =>
              isFiniteCoord(p.position.x) &&
              isFiniteCoord(p.position.y) &&
              isFiniteCoord(p.position.z) &&
              isFiniteCoord(p.rotationY),
          ),
        ),
    },
    {
      name: "ground floor has at least one door on exposed walls",
      check: (r) => {
        const doorIds = new Set(
          r.config.availableElements
            .filter((e) => e.type === "door")
            .map((e) => e.elementId),
        );
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (facade.placements.length === 0) continue;

          // Doors are bottom-aligned, so their Y is bounds.height/2
          const hasDoor = facade.placements.some((p) => doorIds.has(p.elementId));
          if (!hasDoor) return false;
        }
        return true;
      },
    },
    {
      name: "exposed walls have non-empty placements",
      check: (r) =>
        r.facades.every((f) => {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === f.buildingId && w.wallIndex === f.wallIndex,
          );
          if (!wall?.neighborBuildingId) {
            return f.placements.length > 0;
          }
          return true;
        }),
    },
    {
      name: "uses more than one unique window element",
      check: (r) => {
        const windowIds = new Set(
          r.config.availableElements
            .filter((e) => e.type === "window")
            .map((e) => e.elementId),
        );
        const usedWindowIds = new Set<string>();
        for (const facade of r.facades) {
          for (const p of facade.placements) {
            if (windowIds.has(p.elementId)) {
              usedWindowIds.add(p.elementId);
            }
          }
        }
        return usedWindowIds.size >= 2;
      },
    },
    {
      name: "door Y position near floor base",
      check: (r) => {
        const doorElements = r.config.availableElements.filter(
          (e) => e.type === "door",
        );
        const doorIds = new Set(doorElements.map((e) => e.elementId));

        for (const facade of r.facades) {
          for (const p of facade.placements) {
            if (!doorIds.has(p.elementId)) continue;
            const el = r.config.availableElements.find(
              (e) => e.elementId === p.elementId,
            )!;
            const bounds = computeElementBounds(el);
            // Door bottom should be near a floor base
            const doorBottom = p.position.y - bounds.height / 2;
            // Check it's near some floor's baseY
            const nearFloorBase = r.config.floors.some(
              (f) => Math.abs(doorBottom - f.baseY) < 0.1,
            );
            if (!nearFloorBase) return false;
          }
        }
        return true;
      },
    },
    {
      name: "bay grid covers all floor/bay cells for exposed walls",
      check: (r) => {
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.bayGrid) return false;

          const usableWidth = wall!.length - 2 * r.config.edgeMargin;
          const bayCount = Math.floor(usableWidth / r.config.bayWidth);
          const expectedCells = bayCount * r.config.floors.length;
          if (facade.bayGrid.length !== expectedCells) return false;
        }
        return true;
      },
    },
    {
      name: "all placements with scale have scale > 0",
      check: (r) =>
        r.facades.every((f) =>
          f.placements.every(
            (p) =>
              !p.scale ||
              (p.scale.x > 0 && p.scale.y > 0 && p.scale.z > 0),
          ),
        ),
    },
  ],
};
