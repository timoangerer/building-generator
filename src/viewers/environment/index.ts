export type { EnvLayer, FogConfig, ParamDescriptor, EnvPreset } from "./types";
export type { LayerCategory, LayerFactory } from "./registry";
export { registerLayer, getLayerIds, createLayer } from "./registry";
export { presets } from "./presets";
export { createEnvScene, type EnvSceneApi } from "./env-scene";
