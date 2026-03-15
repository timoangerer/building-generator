import type {
  MassingConfig,
  MassingResult,
  BuildingMassing,
  FloorInfo,
  WallSegment,
  Vec2,
  Polygon2D,
} from "@/contracts";
import { createRng, subtract, length as vecLength } from "@/utils";

const EPSILON = 1e-6;

function computeNormal(start: Vec2, end: Vec2): Vec2 {
  const d = subtract(end, start);
  const len = vecLength(d);
  if (len === 0) return { x: 0, z: 1 };
  return { x: d.z / len, z: -d.x / len };
}

function buildWalls(
  buildingId: string,
  footprint: Polygon2D,
  totalHeight: number,
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

/** Check if two axis-aligned walls share a collinear overlapping segment */
function detectPartyWalls(buildings: BuildingMassing[]): void {
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const bA = buildings[i];
      const bB = buildings[j];
      for (const wA of bA.walls) {
        for (const wB of bB.walls) {
          if (areSharedWalls(wA, wB)) {
            wA.neighborBuildingId = bB.buildingId;
            wB.neighborBuildingId = bA.buildingId;
          }
        }
      }
    }
  }
}

function areSharedWalls(a: WallSegment, b: WallSegment): boolean {
  // Check if walls are collinear and overlapping on the same line
  // For axis-aligned rectangles, shared walls have opposite normals
  // and lie on the same coordinate line

  // Both walls must be on the same axis line
  const aVertical = Math.abs(a.start.x - a.end.x) < EPSILON;
  const bVertical = Math.abs(b.start.x - b.end.x) < EPSILON;
  const aHorizontal = Math.abs(a.start.z - a.end.z) < EPSILON;
  const bHorizontal = Math.abs(b.start.z - b.end.z) < EPSILON;

  if (aVertical && bVertical) {
    // Both vertical (constant X). Must share same X coordinate.
    if (Math.abs(a.start.x - b.start.x) > EPSILON) return false;
    // Check Z overlap
    return hasOverlap1D(
      Math.min(a.start.z, a.end.z),
      Math.max(a.start.z, a.end.z),
      Math.min(b.start.z, b.end.z),
      Math.max(b.start.z, b.end.z),
    );
  }

  if (aHorizontal && bHorizontal) {
    // Both horizontal (constant Z). Must share same Z coordinate.
    if (Math.abs(a.start.z - b.start.z) > EPSILON) return false;
    // Check X overlap
    return hasOverlap1D(
      Math.min(a.start.x, a.end.x),
      Math.max(a.start.x, a.end.x),
      Math.min(b.start.x, b.end.x),
      Math.max(b.start.x, b.end.x),
    );
  }

  return false;
}

function hasOverlap1D(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): boolean {
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  return overlapEnd - overlapStart > EPSILON;
}

export function generateMassing(config: MassingConfig): MassingResult {
  const rng = createRng(config.seed);
  const [minFloors, maxFloors] = config.floorCountRange;
  const floorHeight = config.floorHeight;

  const buildings: BuildingMassing[] = config.plots.map((plot) => {
    // Random floor count within range
    const floorCount =
      minFloors + Math.floor(rng() * (maxFloors - minFloors + 1));

    // Random height variation
    const heightOffset =
      (rng() * 2 - 1) * config.heightVariation;

    const totalHeight = floorCount * floorHeight + heightOffset;

    // Distribute height variation into last floor
    const floors: FloorInfo[] = [];
    for (let i = 0; i < floorCount; i++) {
      const isLast = i === floorCount - 1;
      const h = isLast ? floorHeight + heightOffset : floorHeight;
      floors.push({
        floorIndex: i,
        baseY: i * floorHeight,
        height: h,
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

  // Detect party walls between adjacent buildings
  detectPartyWalls(buildings);

  return { config, buildings };
}
