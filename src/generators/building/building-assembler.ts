import type {
  BuildingConfig,
  BuildingResult,
  Building,
  BuildingMassing,
  WallFacade,
} from "@/contracts";

export function assembleBuildings(
  config: BuildingConfig,
  massings: BuildingMassing[],
  facades: WallFacade[]
): BuildingResult {
  const facadesByBuilding = new Map<string, WallFacade[]>();
  for (const facade of facades) {
    const existing = facadesByBuilding.get(facade.buildingId) ?? [];
    existing.push(facade);
    facadesByBuilding.set(facade.buildingId, existing);
  }

  const buildings: Building[] = massings.map((massing) => ({
    buildingId: massing.buildingId,
    plotId: massing.plotId,
    massing,
    facades: facadesByBuilding.get(massing.buildingId) ?? [],
  }));

  return { config, buildings };
}
