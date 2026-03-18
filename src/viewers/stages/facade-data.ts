import { runCityPipeline } from "@/orchestrator";
import { computeElementBounds, type ElementBounds } from "@/core-geometry";
import type {
  WallSegment,
  FloorInfo,
  ElementPlacement,
  ElementDefinition,
  ColorPalette,
  FacadeLayout,
} from "@/contracts";

export type BuildingInfo = {
  buildingId: string;
  wallCount: number;
  walls: { wallIndex: number; length: number; isExposed: boolean }[];
};

export type FacadeLabData = {
  buildings: BuildingInfo[];
};

export type FacadeLabView = {
  wall: WallSegment;
  floors: FloorInfo[];
  bayWidth: number;
  edgeMargin: number;
  placements: ElementPlacement[];
  elementCatalog: Map<string, ElementDefinition>;
  elementBounds: Map<string, ElementBounds>;
  palette: ColorPalette;
  bayCount: number;
  usableWidth: number;
  layout?: FacadeLayout;
};

export function getFacadeLabData(seed: number): FacadeLabData {
  const result = runCityPipeline(seed);
  const buildings: BuildingInfo[] = result.scene.buildings.map((b) => ({
    buildingId: b.buildingId,
    wallCount: b.massing.walls.length,
    walls: b.massing.walls.map((w) => ({
      wallIndex: w.wallIndex,
      length: w.length,
      isExposed: !w.neighborBuildingId,
    })),
  }));
  return { buildings };
}

export function getWallFacadeView(
  seed: number,
  buildingIndex: number,
  wallIndex: number,
): FacadeLabView {
  const result = runCityPipeline(seed);
  const building = result.scene.buildings[buildingIndex];
  const wall = building.massing.walls[wallIndex];
  const facade = building.facades.find(
    (f) => f.wallIndex === wallIndex,
  );

  const catalog = result.scene.elementCatalog;
  const elementMap = new Map<string, ElementDefinition>();
  const boundsMap = new Map<string, ElementBounds>();
  for (const el of catalog.elements) {
    elementMap.set(el.elementId, el);
    boundsMap.set(el.elementId, computeElementBounds(el));
  }

  const layout = facade?.layout;
  const bayWidthConfig = 2.5;
  const edgeMargin = 0.5;
  const usableWidth = layout
    ? layout.bayWidth * layout.bayCount
    : Math.max(0, wall.length - 2 * edgeMargin);
  const bayCount = layout
    ? layout.bayCount
    : Math.max(0, Math.round(usableWidth / bayWidthConfig));
  const bayWidth = layout
    ? layout.bayWidth
    : bayWidthConfig;

  return {
    wall,
    floors: building.massing.floors,
    bayWidth,
    edgeMargin,
    placements: facade?.placements ?? [],
    elementCatalog: elementMap,
    elementBounds: boundsMap,
    palette: catalog.defaultPalette,
    bayCount,
    usableWidth: Math.max(0, usableWidth),
    layout,
  };
}
