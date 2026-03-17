import { BuildingResultSchema } from "@/contracts";
import { assembleBuildings } from "@/generators/building";
import type { BuildingResult, BuildingMassing, WallFacade } from "@/contracts";
import type { GeneratorFixture } from "./types";

type BuildingFixtureConfig = {
  seed: number;
  massings: BuildingMassing[];
  facades: WallFacade[];
};

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

export const buildingFixture: GeneratorFixture<BuildingFixtureConfig, BuildingResult> = {
  name: "assembleBuildings",
  stage: "building",
  generator: (config) =>
    assembleBuildings({ seed: config.seed }, config.massings, config.facades),
  schema: BuildingResultSchema,
  configFactory: (seed): BuildingFixtureConfig => ({
    seed,
    massings: [stubMassing],
    facades: [stubFacade],
  }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "joins massing and facades",
      check: (r) =>
        r.buildings.length === 1 &&
        r.buildings[0].massing.buildingId === "b1" &&
        r.buildings[0].facades.length === 1,
    },
  ],
};
