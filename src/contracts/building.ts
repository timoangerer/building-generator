import type { BuildingMassing } from "./massing";
import type { WallFacade } from "./facade";

export type BuildingConfig = {
  seed: number;
};

export type Building = {
  buildingId: string;
  plotId: string;
  massing: BuildingMassing;
  facades: WallFacade[];
};

export type BuildingResult = {
  config: BuildingConfig;
  buildings: Building[];
};
