import type { StageRenderer } from "../types";
import { createSceneRenderer } from "./scene-renderer";
import { createPlotRenderer } from "./plot-renderer";
import { createMassingRenderer } from "./massing-renderer";
import { createElementRenderer } from "./element-renderer";
import { createFacadeRenderer } from "./facade-renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rendererFactories: Record<string, () => StageRenderer<any>> = {
  pipeline: createSceneRenderer,
  plot: createPlotRenderer,
  massing: createMassingRenderer,
  element: createElementRenderer,
  facade: createFacadeRenderer,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRenderer(stage: string): StageRenderer<any> | null {
  const factory = rendererFactories[stage];
  return factory ? factory() : null;
}
