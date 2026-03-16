import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createEnvScene, type EnvSceneApi } from "./env-scene";
import { ControlPanel } from "./control-panel";
import { presets } from "../presets";
import { getLayerIds, type LayerCategory } from "../registry";
import type { FogConfig, ParamDescriptor } from "../types";
import "../../index.css";

const categories: LayerCategory[] = ["terrain", "sky", "water"];

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<EnvSceneApi | null>(null);

  const [activePreset, setActivePreset] = useState(presets[0].name);
  const [activeLayers, setActiveLayers] = useState<Record<LayerCategory, string>>({
    water: presets[0].water,
    sky: presets[0].sky,
    terrain: presets[0].terrain,
  });
  const [fog, setFog] = useState<FogConfig>(presets[0].fog);
  const [layerParams, setLayerParams] = useState<Record<LayerCategory, ParamDescriptor[]>>({
    water: [],
    sky: [],
    terrain: [],
  });
  const [layerParamValues, setLayerParamValues] = useState<
    Record<LayerCategory, Record<string, number | string>>
  >({
    water: {},
    sky: {},
    terrain: {},
  });

  const layerOptions: Record<LayerCategory, string[]> = {
    water: getLayerIds("water"),
    sky: getLayerIds("sky"),
    terrain: getLayerIds("terrain"),
  };

  // Initialize scene (async for WebGPU renderer)
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    createEnvScene(containerRef.current).then((api) => {
      if (disposed) {
        api.dispose();
        return;
      }
      sceneRef.current = api;

      // Load initial preset
      const preset = presets[0];
      for (const cat of categories) {
        api.setLayer(cat, preset[cat]);
      }
      api.setFog(preset.fog);

      // Apply overrides
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

      // Read initial params
      const params: Record<LayerCategory, ParamDescriptor[]> = { water: [], sky: [], terrain: [] };
      const values: Record<LayerCategory, Record<string, number | string>> = {
        water: {},
        sky: {},
        terrain: {},
      };
      for (const cat of categories) {
        const layer = api.getActiveLayer(cat);
        if (layer) {
          params[cat] = layer.getParams();
          for (const p of params[cat]) {
            values[cat][p.key] = p.default;
          }
        }
      }

      // Apply overrides to values
      if (preset.overrides) {
        for (const [layerId, overrideParams] of Object.entries(preset.overrides)) {
          for (const cat of categories) {
            if (preset[cat] === layerId) {
              for (const [key, value] of Object.entries(overrideParams)) {
                values[cat][key] = value;
              }
            }
          }
        }
      }

      setLayerParams(params);
      setLayerParamValues(values);
    });

    return () => {
      disposed = true;
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  const handlePresetChange = useCallback((name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (!preset || !sceneRef.current) return;
    const api = sceneRef.current;

    setActivePreset(name);
    setActiveLayers({ water: preset.water, sky: preset.sky, terrain: preset.terrain });
    setFog(preset.fog);

    for (const cat of categories) {
      api.setLayer(cat, preset[cat]);
    }
    api.setFog(preset.fog);

    // Apply overrides
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

    // Read params from new layers
    const params: Record<LayerCategory, ParamDescriptor[]> = { water: [], sky: [], terrain: [] };
    const values: Record<LayerCategory, Record<string, number | string>> = {
      water: {},
      sky: {},
      terrain: {},
    };
    for (const cat of categories) {
      const layer = api.getActiveLayer(cat);
      if (layer) {
        params[cat] = layer.getParams();
        for (const p of params[cat]) {
          values[cat][p.key] = p.default;
        }
      }
    }

    // Apply overrides to values
    if (preset.overrides) {
      for (const [layerId, overrideParams] of Object.entries(preset.overrides)) {
        for (const cat of categories) {
          if (preset[cat] === layerId) {
            for (const [key, value] of Object.entries(overrideParams)) {
              values[cat][key] = value;
            }
          }
        }
      }
    }

    setLayerParams(params);
    setLayerParamValues(values);
  }, []);

  const handleLayerChange = useCallback(
    (category: LayerCategory, id: string) => {
      if (!sceneRef.current) return;
      const api = sceneRef.current;

      api.setLayer(category, id);
      setActiveLayers((prev) => ({ ...prev, [category]: id }));
      setActivePreset("Custom");

      const layer = api.getActiveLayer(category);
      if (layer) {
        const params = layer.getParams();
        const values: Record<string, number | string> = {};
        for (const p of params) {
          values[p.key] = p.default;
        }
        setLayerParams((prev) => ({ ...prev, [category]: params }));
        setLayerParamValues((prev) => ({ ...prev, [category]: values }));
      }
    },
    [],
  );

  const handleParamChange = useCallback(
    (category: LayerCategory, key: string, value: number | string) => {
      if (!sceneRef.current) return;
      sceneRef.current.setLayerParam(category, key, value);
      setLayerParamValues((prev) => ({
        ...prev,
        [category]: { ...prev[category], [key]: value },
      }));
      setActivePreset("Custom");
    },
    [],
  );

  const handleFogChange = useCallback((newFog: FogConfig) => {
    if (!sceneRef.current) return;
    sceneRef.current.setFog(newFog);
    setFog(newFog);
    setActivePreset("Custom");
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <ControlPanel
        presetNames={[...presets.map((p) => p.name), "Custom"]}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        layerOptions={layerOptions}
        activeLayers={activeLayers}
        onLayerChange={handleLayerChange}
        layerParams={layerParams}
        layerParamValues={layerParamValues}
        onParamChange={handleParamChange}
        fog={fog}
        onFogChange={handleFogChange}
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
