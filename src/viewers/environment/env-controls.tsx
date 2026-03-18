import React, { useCallback, useEffect, useRef, useState } from "react";
import { useControls, useCreateStore, LevaPanel } from "leva";
import {
  type EnvSceneApi,
  presets,
  getLayerIds,
  type LayerCategory,
  type FogConfig,
  type ParamDescriptor,
} from "./index";

const categories: LayerCategory[] = ["terrain", "sky", "water"];

function findPreset(name: string) {
  return presets.find((p) => p.name === name) ?? presets[0];
}

export function EnvLabControls({ api, presetName }: { api: EnvSceneApi | null; presetName: string }) {
  const preset = findPreset(presetName);
  const store = useCreateStore();

  const [layerParams, setLayerParams] = useState<Record<LayerCategory, ParamDescriptor[]>>({
    water: [],
    sky: [],
    terrain: [],
  });

  const layerOptionSets: Record<LayerCategory, string[]> = {
    water: getLayerIds("water"),
    sky: getLayerIds("sky"),
    terrain: getLayerIds("terrain"),
  };

  const terrainOptions = Object.fromEntries(layerOptionSets.terrain.map((id) => [id, id]));
  const skyOptions = Object.fromEntries(layerOptionSets.sky.map((id) => [id, id]));
  const waterOptions = Object.fromEntries(layerOptionSets.water.map((id) => [id, id]));

  // Helper: get default value for a param, applying preset overrides
  const getDefault = (cat: LayerCategory, pd: ParamDescriptor) => {
    if (preset.overrides) {
      for (const [layerId, overrideParams] of Object.entries(preset.overrides)) {
        if (preset[cat] === layerId && pd.key in overrideParams) {
          return overrideParams[pd.key];
        }
      }
    }
    return pd.default;
  };

  const [terrainControls] = useControls("Terrain", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: terrainOptions, value: preset.terrain },
    };
    for (const p of layerParams.terrain) {
      const val = getDefault("terrain", p);
      if (p.type === "color") {
        schema[p.key] = { value: val as string, label: p.label };
      } else {
        schema[p.key] = { value: val, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, { store }, [layerParams.terrain]);

  const [skyControls] = useControls("Sky", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: skyOptions, value: preset.sky },
    };
    for (const p of layerParams.sky) {
      const val = getDefault("sky", p);
      if (p.type === "color") {
        schema[p.key] = { value: val as string, label: p.label };
      } else {
        schema[p.key] = { value: val, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, { store }, [layerParams.sky]);

  const [waterControls] = useControls("Water", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: waterOptions, value: preset.water },
    };
    for (const p of layerParams.water) {
      const val = getDefault("water", p);
      if (p.type === "color") {
        schema[p.key] = { value: val as string, label: p.label };
      } else {
        schema[p.key] = { value: val, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, { store }, [layerParams.water]);

  const [fogControls] = useControls("Fog", () => ({
    enabled: { value: preset.fog.enabled },
    type: {
      options: { Linear: "linear" as const, Exponential: "exponential" as const },
      value: preset.fog.type,
    },
    color: { value: preset.fog.color },
    near: {
      value: preset.fog.near ?? 50,
      min: 0, max: 200, step: 1,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "linear",
    },
    far: {
      value: preset.fog.far ?? 200,
      min: 50, max: 500, step: 1,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "linear",
    },
    density: {
      value: preset.fog.density ?? 0.01,
      min: 0.0001, max: 0.05, step: 0.0001,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "exponential",
    },
  }), { store }, []);

  const readLayerParams = useCallback((sceneApi: EnvSceneApi) => {
    const params: Record<LayerCategory, ParamDescriptor[]> = { water: [], sky: [], terrain: [] };
    for (const cat of categories) {
      const layer = sceneApi.getActiveLayer(cat);
      if (layer) {
        params[cat] = layer.getParams();
      }
    }
    setLayerParams(params);
  }, []);

  // Apply preset to the scene on mount (when api becomes available)
  const appliedRef = useRef(false);
  useEffect(() => {
    if (!api || appliedRef.current) return;
    appliedRef.current = true;

    for (const cat of categories) {
      api.setLayer(cat, preset[cat]);
    }
    api.setFog(preset.fog);

    if (preset.overrides) {
      for (const [layerId, params] of Object.entries(preset.overrides)) {
        for (const cat of categories) {
          if (preset[cat] === layerId) {
            for (const [key, value] of Object.entries(params)) {
              api.setLayerParam(cat, key, value);
            }
          }
        }
      }
    }

    readLayerParams(api);
  }, [api, preset, readLayerParams]);

  // Sync layer selection changes (user tweaks in Leva)
  const prevLayersRef = useRef({ terrain: preset.terrain, sky: preset.sky, water: preset.water });
  useEffect(() => {
    if (!api) return;
    const current = {
      terrain: terrainControls.layer as string,
      sky: skyControls.layer as string,
      water: waterControls.layer as string,
    };

    for (const cat of categories) {
      if (current[cat] !== prevLayersRef.current[cat]) {
        api.setLayer(cat, current[cat]);
        prevLayersRef.current[cat] = current[cat];

        const layer = api.getActiveLayer(cat);
        if (layer) {
          const params = layer.getParams();
          setLayerParams((prev) => ({ ...prev, [cat]: params }));
        }
      }
    }
  }, [terrainControls.layer, skyControls.layer, waterControls.layer, api]);

  // Sync terrain param changes
  useEffect(() => {
    if (!api) return;
    for (const p of layerParams.terrain) {
      const val = terrainControls[p.key];
      if (val !== undefined) api.setLayerParam("terrain", p.key, val as number | string);
    }
  }, [terrainControls, layerParams.terrain, api]);

  // Sync sky param changes
  useEffect(() => {
    if (!api) return;
    for (const p of layerParams.sky) {
      const val = skyControls[p.key];
      if (val !== undefined) api.setLayerParam("sky", p.key, val as number | string);
    }
  }, [skyControls, layerParams.sky, api]);

  // Sync water param changes
  useEffect(() => {
    if (!api) return;
    for (const p of layerParams.water) {
      const val = waterControls[p.key];
      if (val !== undefined) api.setLayerParam("water", p.key, val as number | string);
    }
  }, [waterControls, layerParams.water, api]);

  // Sync fog changes
  useEffect(() => {
    if (!api) return;
    const fog: FogConfig = {
      enabled: fogControls.enabled as boolean,
      type: fogControls.type as "linear" | "exponential",
      color: fogControls.color as string,
      near: fogControls.near as number,
      far: fogControls.far as number,
      density: fogControls.density as number,
    };
    api.setFog(fog);
  }, [fogControls, api]);

  return React.createElement(LevaPanel, {
    store,
    fill: true,
    collapsed: false,
    titleBar: { title: "Environment" },
  });
}
