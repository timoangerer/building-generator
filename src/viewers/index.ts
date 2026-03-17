// Stage renderers
export { getRenderer, getToolRenderer } from "./stages";

// Environment
export { createEnvScene, type EnvSceneApi, presets, getLayerIds } from "./environment";
export type { EnvLayer, FogConfig, ParamDescriptor, EnvPreset } from "./environment";
export type { LayerCategory } from "./environment";
export { EnvLabControls } from "./environment/env-controls";
export type { EnvRendererHandle } from "./environment/env-renderer";

// Shared rendering utilities
export { buildPartGeometry, buildingBaseColor, createThreeContext, clearMeshes, disposeContext } from "./shared";
export type { ThreeContext, RenderOptions, StageRenderer, ToolRenderer } from "./shared";
