import type { AABB2 } from "./base";
import type { Building } from "./building";
import type { Street } from "./plot";
import type { ElementCatalog } from "./element";

export type SceneConfig = {
  seed: number;
};

export type Scene = {
  buildings: Building[];
  streets: Street[];
  elementCatalog: ElementCatalog;
  sceneBounds: AABB2;
};

export type SceneResult = {
  config: SceneConfig;
  scene: Scene;
};
