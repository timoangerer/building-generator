import type { StageRenderer, ToolRenderer } from "../shared/types";
import { createSceneRenderer } from "./scene-renderer";
import { createPlotRenderer } from "./plot-renderer";
import { createMassingRenderer } from "./massing-renderer";
import { createElementRenderer } from "./element-renderer";
import { createFacadeRenderer } from "./facade-renderer";
import { createBuildingRenderer } from "./building-renderer";
import { createEnvRenderer } from "../environment/env-renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rendererFactories: Record<string, () => StageRenderer<any>> = {
  pipeline: createSceneRenderer,
  plot: createPlotRenderer,
  massing: createMassingRenderer,
  element: createElementRenderer,
  facade: createFacadeRenderer,
  "facade-neo": createFacadeRenderer,
  building: createBuildingRenderer,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRenderer(stage: string): StageRenderer<any> | null {
  const factory = rendererFactories[stage];
  return factory ? factory() : null;
}

const toolRendererFactories: Record<string, () => ToolRenderer> = {
  environment: createEnvRenderer,
};

export function getToolRenderer(id: string): ToolRenderer | null {
  const factory = toolRendererFactories[id];
  return factory ? factory() : null;
}
