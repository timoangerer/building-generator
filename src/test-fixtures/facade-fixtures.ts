import { FacadeResultSchema } from "@/contracts/facade.schema";
import { generateFacade } from "@/generators/facade";
import { isFiniteCoord } from "@/test-utils/geometry-checks";
import type { FacadeConfig, FacadeResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

const elements = [
  {
    elementId: "window-small",
    type: "window" as const,
    geometry: { type: "box" as const, box: { width: 0.8, height: 1.0, depth: 0.1 } },
  },
  {
    elementId: "door-standard",
    type: "door" as const,
    geometry: { type: "box" as const, box: { width: 1.0, height: 2.2, depth: 0.05 } },
  },
];

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
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
    availableElements: elements,
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

          const groundFloorY = r.config.floors[0].baseY + r.config.floors[0].height / 2;
          const groundPlacements = facade.placements.filter(
            (p) => Math.abs(p.position.y - groundFloorY) < 0.1,
          );
          const hasDoor = groundPlacements.some((p) => doorIds.has(p.elementId));
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
  ],
};
