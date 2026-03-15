import { describe, it, expect } from "vitest";
import { BuildingResultSchema } from "@/contracts/building.schema";
import { assembleBuildings } from "./building-assembler";
import type { BuildingMassing, WallFacade } from "@/contracts";

const stubMassing: BuildingMassing = {
  buildingId: "b1",
  plotId: "p1",
  footprint: [
    { x: 0, z: 0 },
    { x: 10, z: 0 },
    { x: 10, z: 15 },
    { x: 0, z: 15 },
  ],
  totalHeight: 9,
  floors: [
    { floorIndex: 0, baseY: 0, height: 3 },
    { floorIndex: 1, baseY: 3, height: 3 },
    { floorIndex: 2, baseY: 6, height: 3 },
  ],
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
};

const stubFacade: WallFacade = {
  buildingId: "b1",
  wallIndex: 0,
  placements: [],
};

describe("assembleBuildings", () => {
  it("validates against BuildingResult schema", () => {
    const result = assembleBuildings({ seed: 42 }, [stubMassing], [stubFacade]);
    const parsed = BuildingResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.issues, null, 2));
    }
  });

  it("joins massing and facades", () => {
    const result = assembleBuildings({ seed: 42 }, [stubMassing], [stubFacade]);
    expect(result.buildings).toHaveLength(1);
    expect(result.buildings[0].massing).toBe(stubMassing);
    expect(result.buildings[0].facades).toHaveLength(1);
  });

  it("is deterministic", () => {
    const r1 = assembleBuildings({ seed: 42 }, [stubMassing], [stubFacade]);
    const r2 = assembleBuildings({ seed: 42 }, [stubMassing], [stubFacade]);
    expect(r1).toEqual(r2);
  });
});
