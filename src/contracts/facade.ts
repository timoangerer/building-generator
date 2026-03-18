import type { Vec3 } from "./base";
import type { WallSegment, FloorInfo } from "./massing";
import type { ElementDefinition } from "./element";
import type { ElementType } from "./element";

export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type PlacementRule = {
  anchor: Anchor;
  origin: Anchor;
  offset?: { x: number; y: number };
};

export type PlacementWarningType =
  | "overflow-top"
  | "overflow-bottom"
  | "overflow-left"
  | "overflow-right"
  | "empty-bay";

export type PlacementWarning = {
  floorIndex: number;
  bayIndex: number;
  elementId: string;
  type: PlacementWarningType;
  overflowAmount?: number;
};

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

export type FacadeLayoutElement = {
  elementId: string;
  elementType: ElementType;
  floorIndex: number;
  bayIndex: number;
  x: number;       // bbox center X in wall-local coords (meters from wall left edge)
  y: number;       // bbox center Y in wall-local coords (meters from wall bottom)
  width: number;   // visual width after scaling
  height: number;  // visual height after scaling
  scale: number;   // uniform scale factor (1.0 = no scaling)
};

export type FacadeLayout = {
  wallLength: number;
  totalHeight: number;
  bayWidth: number;      // actual computed bay width (may differ from config.bayWidth)
  edgeMargin: number;
  bayCount: number;
  floors: { floorIndex: number; baseY: number; height: number }[];
  elements: FacadeLayoutElement[];
  warnings: PlacementWarning[];
};

export type WallFacade = {
  buildingId: string;
  wallIndex: number;
  placements: ElementPlacement[];
  bayGrid?: BayGridEntry[];
  warnings?: PlacementWarning[];
  layout?: FacadeLayout;
};

export type FacadeResult = {
  config: FacadeConfig;
  facades: WallFacade[];
};
