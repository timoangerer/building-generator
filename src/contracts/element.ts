import type { Vec3 } from "./base";

export type ElementType = "window" | "door" | "wall_panel";

export type BoxGeometry = {
  width: number;
  height: number;
  depth: number;
};

export type BoxPartDimensions = { width: number; height: number; depth: number };
export type CylinderPartDimensions = { radius: number; height: number };
export type HalfCylinderPartDimensions = { radius: number; depth: number };

export type GeometryPart =
  | { shape: "box"; dimensions: BoxPartDimensions; role: string; position: Vec3 }
  | { shape: "cylinder"; dimensions: CylinderPartDimensions; role: string; position: Vec3 }
  | { shape: "half_cylinder"; dimensions: HalfCylinderPartDimensions; role: string; position: Vec3 };

export type ElementGeometry =
  | { type: "box"; box: BoxGeometry }
  | { type: "composite"; parts: GeometryPart[] };

export type ColorPalette = Record<string, number>;

export type ElementDefinition = {
  elementId: string;
  type: ElementType;
  geometry: ElementGeometry;
};

export type ElementCatalogConfig = {
  seed: number;
};

export type ElementCatalog = {
  config: ElementCatalogConfig;
  elements: ElementDefinition[];
  defaultPalette: ColorPalette;
};
