import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PlotConfig } from "@/contracts";
import { generatePlots } from "@/generators/plot";
import { PlotCanvas } from "./plot-canvas";
import { ControlPanel } from "./control-panel";
import "../../index.css";

const DEFAULT_CONFIG: PlotConfig = {
  seed: 42,
  streetLength: 60,
  streetWidth: 8,
  plotDepth: 15,
  minPlotWidth: 8,
  maxPlotWidth: 14,
};

function App() {
  const [config, setConfig] = useState<PlotConfig>(DEFAULT_CONFIG);
  const plotResult = useMemo(() => generatePlots(config), [config]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <PlotCanvas plotResult={plotResult} />
      <ControlPanel config={config} onChange={setConfig} />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
