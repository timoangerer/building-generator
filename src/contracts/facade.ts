import type { Vec3 } from "./base";
import type { WallSegment, FloorInfo } from "./massing";
import type { ElementDefinition } from "./element";

export type FacadeConfig = {
  seed: number;
  walls: WallSegment[];
  floors: FloorInfo[];
  availableElements: ElementDefinition[];
  bayWidth: number;
  edgeMargin: number;
};

export type ElementPlacement = {
  elementId: string;
  position: Vec3;
  rotationY: number;
  scale?: Vec3;
};

export type BayGridEntry = {
  floorIndex: number;
  bayIndex: number;
  elementId: string;
};

export type WallFacade = {
  buildingId: string;
  wallIndex: number;
  placements: ElementPlacement[];
  bayGrid?: BayGridEntry[];
};

export type FacadeResult = {
  config: FacadeConfig;
  facades: WallFacade[];
};
