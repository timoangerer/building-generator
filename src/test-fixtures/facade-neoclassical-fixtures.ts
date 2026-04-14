import { FacadeResultSchema } from "@/contracts";
import { generateFacade } from "@/generators/facade";
import { generateElementCatalog } from "@/generators/element";
import { neoclassicalGrammar } from "@/generators/facade";
import type { FacadeConfig, FacadeResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

const catalog = generateElementCatalog({ seed: 1 });

/**
 * Neoclassical grammar facade fixtures — tests the grammar system
 * with placeholder elements (pilasters, rusticated panels, oculus).
 */
const configs: Record<number, { label: string; walls: FacadeConfig["walls"]; floors: FacadeConfig["floors"] }> = {
  1: {
    label: "neo: 3-floor (10m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 10, z: 0 }, height: 9, length: 10, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
  },
  2: {
    label: "neo: wide 4-floor (16m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 16, z: 0 }, height: 13, length: 16, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3.5 },
      { floorIndex: 1, baseY: 3.5, height: 3.5 },
      { floorIndex: 2, baseY: 7, height: 3 },
      { floorIndex: 3, baseY: 10, height: 3 },
    ],
  },
  3: {
    label: "neo: narrow 5-floor (8m)",
    walls: [
      { buildingId: "b1", wallIndex: 0, start: { x: 0, z: 0 }, end: { x: 8, z: 0 }, height: 15, length: 8, normal: { x: 0, z: -1 } },
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
      { floorIndex: 3, baseY: 9, height: 3 },
      { floorIndex: 4, baseY: 12, height: 3 },
    ],
  },
};

export const facadeNeoclassicalFixture: GeneratorFixture<FacadeConfig, FacadeResult> = {
  name: "generateFacade (neoclassical)",
  stage: "facade-neo",
  generator: generateFacade,
  schema: FacadeResultSchema,
  configFactory: (seed): FacadeConfig => {
    const entry = configs[seed];
    if (!entry) {
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
        grammar: neoclassicalGrammar,
      };
    }
    return {
      seed,
      walls: entry.walls,
      floors: entry.floors,
      availableElements: catalog.elements,
      bayWidth: 2.5,
      edgeMargin: 0.5,
      grammar: neoclassicalGrammar,
    };
  },
  seeds: [1, 2, 3],
  labels: Object.values(configs).map((c) => c.label),
  invariants: [
    {
      name: "all placements reference valid element IDs (or placeholders)",
      check: (r) => {
        const validIds = new Set(
          r.config.availableElements.map((e) => e.elementId),
        );
        return r.facades.every((f) =>
          f.placements.every(
            (p) => validIds.has(p.elementId) || p.elementId.startsWith("placeholder:"),
          ),
        );
      },
    },
    {
      name: "layout covers all bay cells",
      check: (r) => {
        for (const facade of r.facades) {
          const wall = r.config.walls.find(
            (w) => w.buildingId === facade.buildingId && w.wallIndex === facade.wallIndex,
          );
          if (wall?.neighborBuildingId) continue;
          if (!facade.layout) return false;
          if (facade.layout.elements.length !== facade.layout.bayCount * facade.layout.floors.length) return false;
        }
        return true;
      },
    },
    {
      name: "grammarId is set to neoclassical",
      check: (r) =>
        r.facades.every((f) => !f.layout || f.layout.grammarId === "neoclassical"),
    },
    {
      name: "contains placeholder elements",
      check: (r) =>
        r.facades.some((f) =>
          f.layout?.elements.some((el) => el.elementId.startsWith("placeholder:")),
        ),
    },
    {
      name: "mirror symmetry produces symmetric bay grid",
      check: (r) => {
        for (const facade of r.facades) {
          if (!facade.layout) continue;
          const layout = facade.layout;
          for (const floor of layout.floors) {
            const floorEls = layout.elements
              .filter((e) => e.floorIndex === floor.floorIndex)
              .sort((a, b) => a.bayIndex - b.bayIndex);
            const n = floorEls.length;
            for (let i = 0; i < Math.floor(n / 2); i++) {
              if (floorEls[i].elementId !== floorEls[n - 1 - i].elementId) {
                return false;
              }
            }
          }
        }
        return true;
      },
    },
    {
      name: "placeholder elements have positive dimensions",
      check: (r) =>
        r.facades.every((f) =>
          f.layout?.elements
            .filter((el) => el.elementId.startsWith("placeholder:"))
            .every((el) => el.width > 0 && el.height > 0) ?? true,
        ),
    },
    {
      name: "no overflow warnings",
      check: (r) =>
        r.facades.every((f) =>
          !f.warnings || f.warnings.every((w) => !w.type.startsWith("overflow-")),
        ),
    },
  ],
};
