import type { Vec2, Polygon2D } from "./base";

export type MassingConfig = {
  seed: number;
  plots: { plotId: string; footprint: Polygon2D }[];
  floorHeight: number;
  floorCountRange: [number, number];
  heightVariation: number;
};

export type FloorInfo = {
  floorIndex: number;
  baseY: number;
  height: number;
};

export type WallSegment = {
  buildingId: string;
  wallIndex: number;
  start: Vec2;
  end: Vec2;
  height: number;
  length: number;
  neighborBuildingId?: string;
  normal: Vec2;
};

export type BuildingMassing = {
  buildingId: string;
  plotId: string;
  footprint: Polygon2D;
  totalHeight: number;
  floors: FloorInfo[];
  walls: WallSegment[];
};

export type MassingResult = {
  config: MassingConfig;
  buildings: BuildingMassing[];
};
