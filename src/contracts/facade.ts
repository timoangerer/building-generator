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
};

export type WallFacade = {
  buildingId: string;
  wallIndex: number;
  placements: ElementPlacement[];
};

export type FacadeResult = {
  config: FacadeConfig;
  facades: WallFacade[];
};
