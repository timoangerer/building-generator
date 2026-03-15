import type { FacadeConfig, FacadeResult, WallFacade } from "@/contracts";

export function generateFacade(config: FacadeConfig): FacadeResult {
  const facades: WallFacade[] = config.walls.map((wall) => ({
    buildingId: wall.buildingId,
    wallIndex: wall.wallIndex,
    placements: [],
  }));

  return { config, facades };
}
