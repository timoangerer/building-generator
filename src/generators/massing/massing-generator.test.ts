import { MassingResultSchema } from "@/contracts/massing.schema";
import { generateMassing } from "./massing-generator";
import { testGeneratorInvariants } from "@/test-utils";
import type { MassingConfig } from "@/contracts";

testGeneratorInvariants({
  name: "generateMassing",
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
          { x: 12, z: 0 },
          { x: 22, z: 0 },
          { x: 22, z: 15 },
          { x: 12, z: 15 },
        ],
      },
    ],
    floorHeight: 3,
    floorCountRange: [3, 5],
    heightVariation: 0.2,
  }),
  invariants: [
    {
      name: "produces one building per plot",
      check: (r) => r.buildings.length === r.config.plots.length,
    },
  ],
});
