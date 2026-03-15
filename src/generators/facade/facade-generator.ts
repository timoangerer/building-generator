import type {
  FacadeConfig,
  FacadeResult,
  WallFacade,
  ElementPlacement,
  Vec3,
} from "@/contracts";

export function generateFacade(config: FacadeConfig): FacadeResult {
  const windowElement = config.availableElements.find(
    (e) => e.type === "window",
  );
  const doorElement = config.availableElements.find((e) => e.type === "door");

  const facades: WallFacade[] = config.walls.map((wall) => {
    // Skip party walls
    if (wall.neighborBuildingId) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    const placements: ElementPlacement[] = [];

    // Compute bays
    const usableWidth = wall.length - 2 * config.edgeMargin;
    if (usableWidth <= 0) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    const bayCount = Math.floor(usableWidth / config.bayWidth);
    if (bayCount === 0) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    // Wall direction (unit vector)
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const dirX = dx / wall.length;
    const dirZ = dz / wall.length;

    // rotationY from wall normal: atan2(nx, nz)
    const rotationY = Math.atan2(wall.normal.x, wall.normal.z);

    // Center bay index for door placement
    const centerBay = Math.floor(bayCount / 2);

    for (const floor of config.floors) {
      for (let bay = 0; bay < bayCount; bay++) {
        // Bay center offset along wall
        const u =
          config.edgeMargin + (bay + 0.5) * config.bayWidth;
        const uNorm = u / wall.length;

        // Floor center Y
        const y = floor.baseY + floor.height / 2;

        // World position using wall direction
        const position: Vec3 = {
          x: wall.start.x + uNorm * dx,
          y,
          z: wall.start.z + uNorm * dz,
        };

        // Ground floor center bay gets a door, everything else gets a window
        const isGroundFloor = floor.floorIndex === 0;
        const isDoorBay = bay === centerBay;
        const element =
          isGroundFloor && isDoorBay ? doorElement : windowElement;

        if (element) {
          placements.push({
            elementId: element.elementId,
            position,
            rotationY,
          });
        }
      }
    }

    return {
      buildingId: wall.buildingId,
      wallIndex: wall.wallIndex,
      placements,
    };
  });

  return { config, facades };
}
