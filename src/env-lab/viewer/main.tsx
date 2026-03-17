import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls } from "leva";
import { createEnvScene, type EnvSceneApi } from "./env-scene";
import { presets } from "../presets";
import { getLayerIds, type LayerCategory } from "../registry";
import type { FogConfig, ParamDescriptor } from "../types";
import "../../index.css";

const categories: LayerCategory[] = ["terrain", "sky", "water"];

const presetOptions = Object.fromEntries(presets.map((p) => [p.name, p.name]));

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<EnvSceneApi | null>(null);
  const [ready, setReady] = useState(false);

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

  // --- Preset ---
  const [{ preset }, setPresetControls] = useControls("Preset", () => ({
    preset: { options: presetOptions, value: presets[0].name },
  }), []);

  // --- Layer selectors & params ---
  const terrainOptions = Object.fromEntries(layerOptionSets.terrain.map((id) => [id, id]));
  const skyOptions = Object.fromEntries(layerOptionSets.sky.map((id) => [id, id]));
  const waterOptions = Object.fromEntries(layerOptionSets.water.map((id) => [id, id]));

  const [terrainControls, setTerrainControls] = useControls("Terrain", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: terrainOptions, value: presets[0].terrain },
    };
    for (const p of layerParams.terrain) {
      if (p.type === "color") {
        schema[p.key] = { value: p.default as string, label: p.label };
      } else {
        schema[p.key] = { value: p.default, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, [layerParams.terrain]);

  const [skyControls, setSkyControls] = useControls("Sky", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: skyOptions, value: presets[0].sky },
    };
    for (const p of layerParams.sky) {
      if (p.type === "color") {
        schema[p.key] = { value: p.default as string, label: p.label };
      } else {
        schema[p.key] = { value: p.default, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, [layerParams.sky]);

  const [waterControls, setWaterControls] = useControls("Water", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<string, any> = {
      layer: { options: waterOptions, value: presets[0].water },
    };
    for (const p of layerParams.water) {
      if (p.type === "color") {
        schema[p.key] = { value: p.default as string, label: p.label };
      } else {
        schema[p.key] = { value: p.default, min: p.min, max: p.max, step: p.step, label: p.label };
      }
    }
    return schema;
  }, [layerParams.water]);

  // --- Fog ---
  const [fogControls, setFogControls] = useControls("Fog", () => ({
    enabled: { value: presets[0].fog.enabled },
    type: {
      options: { Linear: "linear" as const, Exponential: "exponential" as const },
      value: presets[0].fog.type,
    },
    color: { value: presets[0].fog.color },
    near: {
      value: presets[0].fog.near ?? 50,
      min: 0, max: 200, step: 1,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "linear",
    },
    far: {
      value: presets[0].fog.far ?? 200,
      min: 50, max: 500, step: 1,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "linear",
    },
    density: {
      value: presets[0].fog.density ?? 0.01,
      min: 0.0001, max: 0.05, step: 0.0001,
      render: (get: (path: string) => unknown) =>
        get("Fog.enabled") === true && get("Fog.type") === "exponential",
    },
  }), []);

  // Helper to read params from scene and update state
  const readLayerParams = useCallback((api: EnvSceneApi, overrides?: Record<string, Record<string, number | string>>) => {
    const params: Record<LayerCategory, ParamDescriptor[]> = { water: [], sky: [], terrain: [] };
    for (const cat of categories) {
      const layer = api.getActiveLayer(cat);
      if (layer) {
        params[cat] = layer.getParams();
      }
    }
    setLayerParams(params);
    return params;
  }, []);

  // --- Initialize scene ---
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    createEnvScene(containerRef.current).then((api) => {
      if (disposed) {
        api.dispose();
        return;
      }
      sceneRef.current = api;

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

      readLayerParams(api);
      setReady(true);
    });

    return () => {
      disposed = true;
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [readLayerParams]);

  // --- Preset change ---
  const prevPresetRef = useRef(presets[0].name);
  useEffect(() => {
    if (preset === prevPresetRef.current) return;
    prevPresetRef.current = preset;

    const p = presets.find((pr) => pr.name === preset);
    if (!p || !sceneRef.current) return;
    const api = sceneRef.current;

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

    // Read new params from layers
    const newParams = readLayerParams(api);

    // Build default values for each category, then apply overrides
    const buildValues = (cat: LayerCategory): Record<string, unknown> => {
      const vals: Record<string, unknown> = { layer: p[cat] };
      for (const pd of newParams[cat]) {
        vals[pd.key] = pd.default;
      }
      if (p.overrides) {
        for (const [layerId, overrideParams] of Object.entries(p.overrides)) {
          if (p[cat] === layerId) {
            for (const [key, value] of Object.entries(overrideParams)) {
              vals[key] = value;
            }
          }
        }
      }
      return vals;
    };

    setTerrainControls(buildValues("terrain"));
    setSkyControls(buildValues("sky"));
    setWaterControls(buildValues("water"));
    setFogControls({
      enabled: p.fog.enabled,
      type: p.fog.type,
      color: p.fog.color,
      near: p.fog.near ?? 50,
      far: p.fog.far ?? 200,
      density: p.fog.density ?? 0.01,
    });
  }, [preset, readLayerParams, setTerrainControls, setSkyControls, setWaterControls, setFogControls]);

  // --- Sync layer selection changes ---
  const prevLayersRef = useRef({ terrain: presets[0].terrain, sky: presets[0].sky, water: presets[0].water });
  useEffect(() => {
    if (!sceneRef.current || !ready) return;
    const api = sceneRef.current;
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
  }, [terrainControls.layer, skyControls.layer, waterControls.layer, ready]);

  // --- Sync layer param changes ---
  useEffect(() => {
    if (!sceneRef.current || !ready) return;
    const api = sceneRef.current;
    for (const p of layerParams.terrain) {
      const val = terrainControls[p.key];
      if (val !== undefined) api.setLayerParam("terrain", p.key, val as number | string);
    }
  }, [terrainControls, layerParams.terrain, ready]);

  useEffect(() => {
    if (!sceneRef.current || !ready) return;
    const api = sceneRef.current;
    for (const p of layerParams.sky) {
      const val = skyControls[p.key];
      if (val !== undefined) api.setLayerParam("sky", p.key, val as number | string);
    }
  }, [skyControls, layerParams.sky, ready]);

  useEffect(() => {
    if (!sceneRef.current || !ready) return;
    const api = sceneRef.current;
    for (const p of layerParams.water) {
      const val = waterControls[p.key];
      if (val !== undefined) api.setLayerParam("water", p.key, val as number | string);
    }
  }, [waterControls, layerParams.water, ready]);

  // --- Sync fog changes ---
  useEffect(() => {
    if (!sceneRef.current || !ready) return;
    const fog: FogConfig = {
      enabled: fogControls.enabled as boolean,
      type: fogControls.type as "linear" | "exponential",
      color: fogControls.color as string,
      near: fogControls.near as number,
      far: fogControls.far as number,
      density: fogControls.density as number,
    };
    sceneRef.current.setFog(fog);
  }, [fogControls, ready]);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Leva collapsed={false} titleBar={{ title: "Env Lab" }} />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
