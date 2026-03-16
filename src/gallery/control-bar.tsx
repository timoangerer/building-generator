import React from "react";
import type { RenderOptions } from "./types";

type ControlBarProps = {
  renderOptions: RenderOptions;
  onRenderOptionsChange: (options: RenderOptions) => void;
  showJson: boolean;
  onShowJsonChange: (show: boolean) => void;
  selectedSeed: number | null;
  seedCount: number;
  seedIndex: number;
  onSeedStep: (delta: number) => void;
};

export function ControlBar({
  renderOptions,
  onRenderOptionsChange,
  showJson,
  onShowJsonChange,
  selectedSeed,
  seedCount,
  seedIndex,
  onSeedStep,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-4 px-3 py-2 border-b border-zinc-800 text-sm">
      {/* Wireframe */}
      <label className="flex items-center gap-1.5 text-zinc-400">
        <input
          type="checkbox"
          checked={renderOptions.wireframe}
          onChange={(e) =>
            onRenderOptionsChange({ ...renderOptions, wireframe: e.target.checked })
          }
          className="accent-zinc-500"
        />
        Wireframe
      </label>

      {/* Color mode */}
      <label className="flex items-center gap-1.5 text-zinc-400">
        Color:
        <select
          value={renderOptions.colorMode}
          onChange={(e) =>
            onRenderOptionsChange({
              ...renderOptions,
              colorMode: e.target.value as RenderOptions["colorMode"],
            })
          }
          className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-200"
        >
          <option value="role">Role</option>
          <option value="element-type">Element Type</option>
          <option value="building">Building</option>
          <option value="flat">Flat</option>
        </select>
      </label>

      {/* Bounds overlay */}
      <label className="flex items-center gap-1.5 text-zinc-400">
        <input
          type="checkbox"
          checked={renderOptions.showBounds}
          onChange={(e) =>
            onRenderOptionsChange({ ...renderOptions, showBounds: e.target.checked })
          }
          className="accent-zinc-500"
        />
        Bounds
      </label>

      {/* JSON inspector toggle */}
      <label className="flex items-center gap-1.5 text-zinc-400">
        <input
          type="checkbox"
          checked={showJson}
          onChange={(e) => onShowJsonChange(e.target.checked)}
          className="accent-zinc-500"
        />
        JSON
      </label>

      {/* Seed stepper */}
      {selectedSeed !== null && (
        <div className="flex items-center gap-1.5 ml-auto text-zinc-400">
          <button
            onClick={() => onSeedStep(-1)}
            disabled={seedIndex <= 0}
            className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded disabled:opacity-30 text-zinc-200 hover:bg-zinc-700"
          >
            &lt;
          </button>
          <span className="text-zinc-200 min-w-[4rem] text-center">
            seed {selectedSeed}
          </span>
          <button
            onClick={() => onSeedStep(1)}
            disabled={seedIndex >= seedCount - 1}
            className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded disabled:opacity-30 text-zinc-200 hover:bg-zinc-700"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
