import { FacadeResultSchema } from "@/contracts";
import { generateFacade } from "@/generators/facade";
import { generateElementCatalog } from "@/generators/element";
import { computeElementBounds } from "@/core-geometry";
import { isFiniteCoord } from "@/test-utils";
import type { FacadeConfig, FacadeResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

const catalog = generateElementCatalog({ seed: 1 });

/**
 * Each seed maps to a curated wall configuration so the gallery sidebar
 * shows meaningfully different facade setups rather than random variations
 * of the same geometry.
 */
const configs: Record<number, { label: string; walls: FacadeConfig["walls"]; floors: FacadeConfig["floors"] }> = {
  1: {
    label: "narrow 3-floor (8m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 8, z: 0 }, height: 9, length: 8, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
  },
  2: {
    label: "wide 3-floor (16m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 16, z: 0 }, height: 9, length: 16, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
  },
  3: {
    label: "tall 4-floor (10m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 10, z: 0 }, height: 13, length: 10, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3.5 },
      { floorIndex: 1, baseY: 3.5, height: 3 },
      { floorIndex: 2, baseY: 6.5, height: 3 },
      { floorIndex: 3, baseY: 9.5, height: 3.5 },
    ],
  },
  4: {
    label: "low wide (22m, 2-floor)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 22, z: 0 }, height: 6, length: 22, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
    ],
  },
  5: {
    label: "with party wall (10m + 12m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 10, z: 0 }, height: 9, length: 10, normal: { x: 0, z: -1 } },
      { buildingId: "b1", wallIndex: 1, start: { x: 10, z: 0 }, end: { x: 10, z: 12 }, height: 9, length: 12, normal: { x: 1, z: 0 }, neighborBuildingId: "b2" },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
  },
};

export const facadeFixture: GeneratorFixture<FacadeConfig, FacadeResult> = {
  name: "generateFacade",
  stage: "facade",
  generator: generateFacade,
  schema: FacadeResultSchema,
  configFactory: (seed): FacadeConfig => {
    const entry = configs[seed];
    if (!entry) {
      // Fallback for unknown seeds: simple 10m wall
      return {
        seed,
        walls: [
          { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 10, z: 0 }, height: 9, length: 10, normal: { x: 0, z: -1 } },
        ],
        floors: [
          { floorIndex: 0, baseY: 0, height: 3 },
          { floorIndex: 1, baseY: 3, height: 3 },
          { floorIndex: 2, baseY: 6, height: 3 },
        ],
        availableElements: catalog.elements,
        bayWidth: 2.5,
        edgeMargin: 0.5,
      };
    }
    return {
      seed,
      walls: entry.walls,
      floors: entry.floors,
      availableElements: catalog.elements,
      bayWidth: 2.5,
      edgeMargin: 0.5,
    };
  },
  seeds: [1, 2, 3, 4, 5],
  labels: Object.values(configs).map((c) => c.label),
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
            const sy = p.scale?.y ?? 1;
            const doorBottom = p.position.y + bounds.offsetY * sy - (bounds.height * sy) / 2;
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

          const bayCount = facade.layout
            ? facade.layout.bayCount
            : Math.floor((wall!.length - 2 * r.config.edgeMargin) / r.config.bayWidth);
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
    {
      name: "no overflow warnings on any fixture seed",
      check: (r) =>
        r.facades.every((f) =>
          !f.warnings || f.warnings.every((w) => !w.type.startsWith("overflow-")),
        ),
    },
    {
      name: "all doors have bottom edge within 0.02m of floor base",
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
            const sy = p.scale?.y ?? 1;
            const doorBottom = p.position.y + bounds.offsetY * sy - (bounds.height * sy) / 2;
            const nearFloorBase = r.config.floors.some(
              (f) => Math.abs(doorBottom - f.baseY) < 0.02,
            );
            if (!nearFloorBase) return false;
          }
        }
        return true;
      },
    },
    {
      name: "no empty-bay warnings on exposed walls",
      check: (r) =>
        r.facades.every((f) => {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === f.buildingId && w.wallIndex === f.wallIndex,
          );
          if (wall?.neighborBuildingId) return true;
          return !f.warnings || f.warnings.every((w) => w.type !== "empty-bay");
        }),
    },
    {
      name: "all placed elements fit within wall bounds (visual check)",
      check: (r) => {
        const tolerance = 0.02;
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (!wall || wall.neighborBuildingId) continue;
          const totalHeight =
            r.config.floors.length > 0
              ? r.config.floors[r.config.floors.length - 1].baseY +
                r.config.floors[r.config.floors.length - 1].height
              : 0;

          for (const p of facade.placements) {
            const el = r.config.availableElements.find(
              (e) => e.elementId === p.elementId,
            );
            if (!el) return false;
            const bounds = computeElementBounds(el);
            const sx = p.scale?.x ?? 1;
            const sy = p.scale?.y ?? 1;

            const cx = p.position.x + bounds.offsetX * sx;
            const cy = p.position.y + bounds.offsetY * sy;
            const halfW = (bounds.width * sx) / 2;
            const halfH = (bounds.height * sy) / 2;

            // Check Y bounds (bottom >= 0, top <= totalHeight)
            if (cy - halfH < -tolerance) return false;
            if (cy + halfH > totalHeight + tolerance) return false;
          }
        }
        return true;
      },
    },
    {
      name: "layout covers all bay cells",
      check: (r) => {
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.layout) return false;
          if (facade.layout.elements.length !== facade.layout.bayCount * facade.layout.floors.length) return false;
        }
        return true;
      },
    },
    {
      name: "layout elements within floor bounds",
      check: (r) => {
        const tolerance = 0.02;
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.layout) return false;

          for (const el of facade.layout.elements) {
            const floor = facade.layout.floors.find(
              (f) => f.floorIndex === el.floorIndex,
            );
            if (!floor) return false;

            const bottom = el.y - el.height / 2;
            const top = el.y + el.height / 2;
            if (bottom < floor.baseY - tolerance) return false;
            if (top > floor.baseY + floor.height + tolerance) return false;
          }
        }
        return true;
      },
    },
    {
      name: "layout elements within bay bounds",
      check: (r) => {
        const tolerance = 0.02;
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.layout) return false;

          for (const el of facade.layout.elements) {
            const bayLeft = facade.layout.edgeMargin + el.bayIndex * facade.layout.bayWidth;
            const bayRight = bayLeft + facade.layout.bayWidth;
            const left = el.x - el.width / 2;
            const right = el.x + el.width / 2;
            if (left < bayLeft - tolerance) return false;
            if (right > bayRight + tolerance) return false;
          }
        }
        return true;
      },
    },
    {
      name: "layout elements within wall bounds",
      check: (r) => {
        const tolerance = 0.02;
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) =>
              w.buildingId === facade.buildingId &&
              w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.layout) return false;

          for (const el of facade.layout.elements) {
            const left = el.x - el.width / 2;
            const right = el.x + el.width / 2;
            const bottom = el.y - el.height / 2;
            const top = el.y + el.height / 2;
            if (left < -tolerance) return false;
            if (right > facade.layout.wallLength + tolerance) return false;
            if (bottom < -tolerance) return false;
            if (top > facade.layout.totalHeight + tolerance) return false;
          }
        }
        return true;
      },
    },
  ],
};
