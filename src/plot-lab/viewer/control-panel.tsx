import React from "react";
import type { PlotConfig } from "@/contracts";

interface ControlPanelProps {
  config: PlotConfig;
  onChange: (config: PlotConfig) => void;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span className="text-zinc-500">{value}</span>
      </div>
      <input
        type="range"
        min={min ?? 1}
        max={max ?? 100}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-blue-400"
      />
    </label>
  );
}

export function ControlPanel({ config, onChange }: ControlPanelProps) {
  const set = (key: keyof PlotConfig, value: number) =>
    onChange({ ...config, [key]: value });

  return (
    <div className="absolute top-4 right-4 w-60 bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-700 p-4 space-y-3 text-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Plot Config
      </h2>

      <label className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-300">Seed</span>
        <input
          type="number"
          min={0}
          step={1}
          value={config.seed}
          onChange={(e) => set("seed", parseInt(e.target.value) || 0)}
          className="w-20 bg-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 border border-zinc-700 text-right"
        />
      </label>

      <hr className="border-zinc-700" />

      <NumberField
        label="Street Length"
        value={config.streetLength}
        onChange={(v) => set("streetLength", v)}
        min={10}
        max={200}
      />
      <NumberField
        label="Street Width"
        value={config.streetWidth}
        onChange={(v) => set("streetWidth", v)}
        min={2}
        max={30}
      />
      <NumberField
        label="Plot Depth"
        value={config.plotDepth}
        onChange={(v) => set("plotDepth", v)}
        min={5}
        max={50}
      />
      <NumberField
        label="Min Plot Width"
        value={config.minPlotWidth}
        onChange={(v) => set("minPlotWidth", v)}
        min={3}
        max={config.maxPlotWidth}
      />
      <NumberField
        label="Max Plot Width"
        value={config.maxPlotWidth}
        onChange={(v) => set("maxPlotWidth", v)}
        min={config.minPlotWidth}
        max={50}
      />
    </div>
  );
}
