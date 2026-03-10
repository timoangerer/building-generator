export const facadeSides = ["north", "east", "south", "west", "inner"] as const;

export type FacadeSide = (typeof facadeSides)[number];
export type FacadeHeaderType = "lintel" | "pediment" | "arch";

export interface FacadeBalcony {
  every: number;
  depth: number;
  railHeight: number;
}

export interface FacadeItem {
  type: string;
  width?: number;
  widthRatio?: number;
  minWidth?: number;
  maxWidth?: number;
  gap?: number;
  frameDepth?: number;
  arch?: boolean;
  sill?: boolean;
  header?: FacadeHeaderType;
  balcony?: FacadeBalcony;
  repeatFit?: boolean;
}

export interface FacadeRow {
  height?: number;
  repeatFloors?: boolean;
  heightPerFloor?: number;
  items?: FacadeItem[];
}

export interface FacadeOrnament {
  type: string;
  size: number;
  offsetY: number;
}

export interface FacadeZone {
  key: string;
  height?: number;
  flex?: number;
  inset?: number;
  rows?: FacadeRow[];
  ornaments?: FacadeOrnament[];
}

export interface FacadeDefinition {
  name: string;
  zones: FacadeZone[];
}

export type FacadeMap = Record<FacadeSide, FacadeDefinition>;

export interface WallSpec {
  side: FacadeSide;
  width: number;
  height: number;
  floors: number;
  floorHeight: number;
  previewDepth: number;
}

export interface ResolvedZone extends FacadeZone {
  resolvedHeight: number;
}

export interface PlannedRow extends FacadeRow {
  key: string;
  resolvedHeight: number;
  y: number;
  floorIndex: number;
  width: number;
}

export interface PositionedRowItem extends FacadeItem {
  resolvedWidth: number;
  x: number;
  width: number;
  index: number;
}

export interface LayoutItem extends PositionedRowItem {
  key: string;
  absoluteY: number;
  centerY: number;
  visualHeight: number;
  hasBalcony: boolean;
}

export interface LayoutRow extends PlannedRow {
  absoluteY: number;
  centerY: number;
  items: LayoutItem[];
}

export interface LayoutZone {
  key: string;
  y: number;
  height: number;
  inset: number;
  contentWidth: number;
  rows: LayoutRow[];
  ornaments: FacadeOrnament[];
}

export interface ComponentSummary {
  type: string;
  count: number;
  zones: string[];
}

export interface LayoutSummary {
  width: number;
  height: number;
  area: number;
  zoneCount: number;
  rowCount: number;
  componentCount: number;
  uniqueComponentTypes: number;
}

export interface FacadeLayout {
  facadeName: string;
  wall: WallSpec;
  zones: LayoutZone[];
  components: ComponentSummary[];
  summary: LayoutSummary;
}
