import { MassingResultSchema } from "@/contracts";
import { generateMassing } from "@/generators/massing";
import type { MassingConfig, MassingResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

export const massingFixture: GeneratorFixture<MassingConfig, MassingResult> = {
  name: "generateMassing",
  stage: "massing",
  generator: generateMassing,
  schema: MassingResultSchema,
  configFactory: (seed): MassingConfig => ({
    seed,
    plots: [
      {
        plotId: "plot-1",
        footprint: [
          { x: 0, z: 0 },
          { x: 10, z: 0 },
          { x: 10, z: 15 },
          { x: 0, z: 15 },
        ],
      },
      {
        plotId: "plot-2",
        footprint: [
          { x: 10, z: 0 },
          { x: 22, z: 0 },
          { x: 22, z: 15 },
          { x: 10, z: 15 },
        ],
      },
    ],
    floorHeight: 3,
    floorCountRange: [3, 5],
    heightVariation: 0.2,
  }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "produces one building per plot",
      check: (r) => r.buildings.length === r.config.plots.length,
    },
    {
      name: "floor count is within floorCountRange",
      check: (r) => {
        const [min, max] = r.config.floorCountRange;
        return r.buildings.every(
          (b) => b.floors.length >= min && b.floors.length <= max,
        );
      },
    },
    {
      name: "floor baseY values are monotonically increasing",
      check: (r) =>
        r.buildings.every((b) =>
          b.floors.every(
            (f, i) => i === 0 || f.baseY > b.floors[i - 1].baseY,
          ),
        ),
    },
    {
      name: "party walls are symmetric",
      check: (r) => {
        for (const b of r.buildings) {
          for (const w of b.walls) {
            if (w.neighborBuildingId) {
              const neighbor = r.buildings.find(
                (nb) => nb.buildingId === w.neighborBuildingId,
              );
              if (!neighbor) return false;
              const hasReverse = neighbor.walls.some(
                (nw) => nw.neighborBuildingId === b.buildingId,
              );
              if (!hasReverse) return false;
            }
          }
        }
        return true;
      },
    },
    {
      name: "walls form closed perimeter (end[i] == start[i+1])",
      check: (r) =>
        r.buildings.every((b) =>
          b.walls.every((w, i) => {
            const next = b.walls[(i + 1) % b.walls.length];
            return (
              Math.abs(w.end.x - next.start.x) < 0.001 &&
              Math.abs(w.end.z - next.start.z) < 0.001
            );
          }),
        ),
    },
    {
      name: "wall normals point outward (positive cross product with wall direction)",
      check: (r) =>
        r.buildings.every((b) => {
          const cx =
            b.footprint.reduce((s, v) => s + v.x, 0) / b.footprint.length;
          const cz =
            b.footprint.reduce((s, v) => s + v.z, 0) / b.footprint.length;
          return b.walls.every((w) => {
            const mx = (w.start.x + w.end.x) / 2;
            const mz = (w.start.z + w.end.z) / 2;
            const toCenterX = mx - cx;
            const toCenterZ = mz - cz;
            const dotVal = w.normal.x * toCenterX + w.normal.z * toCenterZ;
            return dotVal > 0;
          });
        }),
    },
  ],
};
