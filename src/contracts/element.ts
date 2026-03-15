export type ElementType = "window" | "door" | "wall_panel";

export type BoxGeometry = {
  width: number;
  height: number;
  depth: number;
};

export type ElementGeometry = {
  type: "box";
  box: BoxGeometry;
};

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
};
