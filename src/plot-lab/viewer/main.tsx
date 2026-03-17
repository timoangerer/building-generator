import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls } from "leva";
import type { PlotConfig } from "@/contracts";
import { generatePlots } from "@/generators/plot";
import { PlotCanvas } from "./plot-canvas";
import "../../index.css";

function App() {
  const raw = useControls("Generation", {
    seed: { value: 42, step: 1 },
    streetLength: { value: 60, min: 10, max: 200, step: 1 },
    streetWidth: { value: 8, min: 2, max: 30, step: 1 },
    plotDepth: { value: 15, min: 5, max: 50, step: 1 },
    minPlotWidth: { value: 8, min: 3, max: 50, step: 1 },
    maxPlotWidth: { value: 14, min: 3, max: 50, step: 1 },
  });

  const config = useMemo<PlotConfig>(() => ({
    seed: raw.seed,
    streetLength: raw.streetLength,
    streetWidth: raw.streetWidth,
    plotDepth: raw.plotDepth,
    minPlotWidth: Math.min(raw.minPlotWidth, raw.maxPlotWidth),
    maxPlotWidth: Math.max(raw.minPlotWidth, raw.maxPlotWidth),
  }), [raw]);

  const plotResult = useMemo(() => generatePlots(config), [config]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Leva collapsed={false} titleBar={{ title: "Plot Lab" }} />
      <PlotCanvas plotResult={plotResult} />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
