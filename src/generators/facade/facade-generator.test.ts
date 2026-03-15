import { FacadeResultSchema } from "@/contracts/facade.schema";
import { generateFacade } from "./facade-generator";
import { testGeneratorInvariants } from "@/test-utils";
import type { FacadeConfig } from "@/contracts";

testGeneratorInvariants({
  name: "generateFacade",
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
    ],
    floors: [
      { floorIndex: 0, baseY: 0, height: 3 },
      { floorIndex: 1, baseY: 3, height: 3 },
      { floorIndex: 2, baseY: 6, height: 3 },
    ],
    availableElements: [],
    bayWidth: 2.5,
    edgeMargin: 0.5,
  }),
  invariants: [
    {
      name: "returns empty placements (stub)",
      check: (r) => r.facades.every((f) => f.placements.length === 0),
    },
  ],
});
