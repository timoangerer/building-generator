import { createEnvScene, type EnvSceneApi, presets, type LayerCategory } from "./index";
import type { ToolRenderer } from "../shared/types";

const categories: LayerCategory[] = ["terrain", "sky", "water"];

export type EnvRendererHandle = ToolRenderer & {
  getApi(): EnvSceneApi | null;
};

export function createEnvRenderer(): EnvRendererHandle {
  let api: EnvSceneApi | null = null;

  return {
    async mount(container: HTMLElement) {
      api = await createEnvScene(container);

      const p = presets[0];
      for (const cat of categories) {
        api.setLayer(cat, p[cat]);
      }
      api.setFog(p.fog);

      if (p.overrides) {
        for (const [layerId, params] of Object.entries(p.overrides)) {
          for (const cat of categories) {
            if (p[cat] === layerId) {
              for (const [key, value] of Object.entries(params)) {
                api.setLayerParam(cat, key, value);
              }
            }
          }
        }
      }
    },

    dispose() {
      if (api) {
        api.dispose();
        api = null;
      }
    },

    getApi() {
      return api;
    },
  };
}
