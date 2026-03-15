import type {
  MassingConfig,
  MassingResult,
  BuildingMassing,
  FloorInfo,
  WallSegment,
  Vec2,
  Polygon2D,
} from "@/contracts";
import { subtract, length as vecLength } from "@/utils";

function computeNormal(start: Vec2, end: Vec2): Vec2 {
  const d = subtract(end, start);
  const len = vecLength(d);
  if (len === 0) return { x: 0, z: 1 };
  return { x: -d.z / len, z: d.x / len };
}

function buildWalls(
  buildingId: string,
  footprint: Polygon2D,
  totalHeight: number
): WallSegment[] {
  const walls: WallSegment[] = [];
  for (let i = 0; i < footprint.length; i++) {
    const start = footprint[i];
    const end = footprint[(i + 1) % footprint.length];
    const d = subtract(end, start);
    walls.push({
      buildingId,
      wallIndex: i,
      start,
      end,
      height: totalHeight,
      length: vecLength(d),
      normal: computeNormal(start, end),
    });
  }
  return walls;
}

export function generateMassing(config: MassingConfig): MassingResult {
  const floorCount = config.floorCountRange[0];
  const floorHeight = config.floorHeight;
  const totalHeight = floorCount * floorHeight;

  const buildings: BuildingMassing[] = config.plots.map((plot) => {
    const floors: FloorInfo[] = [];
    for (let i = 0; i < floorCount; i++) {
      floors.push({
        floorIndex: i,
        baseY: i * floorHeight,
        height: floorHeight,
      });
    }

    const buildingId = `building-${plot.plotId}`;
    return {
      buildingId,
      plotId: plot.plotId,
      footprint: plot.footprint,
      totalHeight,
      floors,
      walls: buildWalls(buildingId, plot.footprint, totalHeight),
    };
  });

  return { config, buildings };
}
