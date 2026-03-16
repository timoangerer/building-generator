import React, { useCallback } from "react";
import type { FogConfig, ParamDescriptor } from "../types";
import type { LayerCategory } from "../registry";

interface ControlPanelProps {
  presetNames: string[];
  activePreset: string;
  onPresetChange: (name: string) => void;

  layerOptions: Record<LayerCategory, string[]>;
  activeLayers: Record<LayerCategory, string>;
  onLayerChange: (category: LayerCategory, id: string) => void;

  layerParams: Record<LayerCategory, ParamDescriptor[]>;
  layerParamValues: Record<LayerCategory, Record<string, number | string>>;
  onParamChange: (category: LayerCategory, key: string, value: number | string) => void;

  fog: FogConfig;
  onFogChange: (fog: FogConfig) => void;
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: ParamDescriptor;
  value: number | string;
  onChange: (key: string, value: number | string) => void;
}) {
  if (param.type === "color") {
    return (
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-300">{param.label}</span>
        <input
          type="color"
          value={String(value)}
          onChange={(e) => onChange(param.key, e.target.value)}
          className="w-8 h-6 cursor-pointer bg-transparent border-0"
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs text-zinc-300">
        <span>{param.label}</span>
        <span className="text-zinc-500">{typeof value === "number" ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={param.min ?? 0}
        max={param.max ?? 10}
        step={param.step ?? 0.01}
        value={Number(value)}
        onChange={(e) => onChange(param.key, parseFloat(e.target.value))}
        className="w-full h-1 accent-blue-400"
      />
    </label>
  );
}

function LayerSection({
  category,
  label,
  options,
  activeId,
  params,
  paramValues,
  onLayerChange,
  onParamChange,
}: {
  category: LayerCategory;
  label: string;
  options: string[];
  activeId: string;
  params: ParamDescriptor[];
  paramValues: Record<string, number | string>;
  onLayerChange: (category: LayerCategory, id: string) => void;
  onParamChange: (category: LayerCategory, key: string, value: number | string) => void;
}) {
  const handleParam = useCallback(
    (key: string, value: number | string) => onParamChange(category, key, value),
    [category, onParamChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</h3>
        <select
          value={activeId}
          onChange={(e) => onLayerChange(category, e.target.value)}
          className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 border border-zinc-700"
        >
          {options.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 pl-1">
        {params.map((p) => (
          <ParamControl
            key={p.key}
            param={p}
            value={paramValues[p.key] ?? p.default}
            onChange={handleParam}
          />
        ))}
      </div>
    </div>
  );
}

export function ControlPanel({
  presetNames,
  activePreset,
  onPresetChange,
  layerOptions,
  activeLayers,
  onLayerChange,
  layerParams,
  layerParamValues,
  onParamChange,
  fog,
  onFogChange,
}: ControlPanelProps) {
  return (
    <div className="absolute top-4 right-4 w-64 max-h-[calc(100vh-2rem)] overflow-y-auto bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-700 p-4 space-y-4 text-sm">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Preset</h2>
        <select
          value={activePreset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="w-full bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1.5 border border-zinc-700"
        >
          {presetNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <hr className="border-zinc-700" />

      <LayerSection
        category="terrain"
        label="Terrain"
        options={layerOptions.terrain}
        activeId={activeLayers.terrain}
        params={layerParams.terrain}
        paramValues={layerParamValues.terrain}
        onLayerChange={onLayerChange}
        onParamChange={onParamChange}
      />

      <LayerSection
        category="sky"
        label="Sky"
        options={layerOptions.sky}
        activeId={activeLayers.sky}
        params={layerParams.sky}
        paramValues={layerParamValues.sky}
        onLayerChange={onLayerChange}
        onParamChange={onParamChange}
      />

      <LayerSection
        category="water"
        label="Water"
        options={layerOptions.water}
        activeId={activeLayers.water}
        params={layerParams.water}
        paramValues={layerParamValues.water}
        onLayerChange={onLayerChange}
        onParamChange={onParamChange}
      />

      <hr className="border-zinc-700" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Fog</h3>
          <label className="flex items-center gap-1.5 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={fog.enabled}
              onChange={(e) => onFogChange({ ...fog, enabled: e.target.checked })}
              className="accent-blue-400"
            />
            Enabled
          </label>
        </div>
        {fog.enabled && (
          <div className="space-y-1.5 pl-1">
            <label className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300">Type</span>
              <select
                value={fog.type}
                onChange={(e) =>
                  onFogChange({ ...fog, type: e.target.value as "linear" | "exponential" })
                }
                className="bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 border border-zinc-700"
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300">Color</span>
              <input
                type="color"
                value={fog.color}
                onChange={(e) => onFogChange({ ...fog, color: e.target.value })}
                className="w-8 h-6 cursor-pointer bg-transparent border-0"
              />
            </label>
            {fog.type === "linear" ? (
              <>
                <label className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Near</span>
                    <span className="text-zinc-500">{fog.near ?? 50}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={1}
                    value={fog.near ?? 50}
                    onChange={(e) => onFogChange({ ...fog, near: parseFloat(e.target.value) })}
                    className="w-full h-1 accent-blue-400"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Far</span>
                    <span className="text-zinc-500">{fog.far ?? 200}</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={1}
                    value={fog.far ?? 200}
                    onChange={(e) => onFogChange({ ...fog, far: parseFloat(e.target.value) })}
                    className="w-full h-1 accent-blue-400"
                  />
                </label>
              </>
            ) : (
              <label className="flex flex-col gap-0.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Density</span>
                  <span className="text-zinc-500">{(fog.density ?? 0.01).toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min={0.0001}
                  max={0.05}
                  step={0.0001}
                  value={fog.density ?? 0.01}
                  onChange={(e) => onFogChange({ ...fog, density: parseFloat(e.target.value) })}
                  className="w-full h-1 accent-blue-400"
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
