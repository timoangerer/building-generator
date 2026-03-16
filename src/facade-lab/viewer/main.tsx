import React, { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Leva, useControls } from "leva";
import { getFacadeLabData, getWallFacadeView } from "../data-source";
import { renderFacade2D, type ViewMode } from "../renderer/facade-canvas";
import "../../index.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { seed } = useControls("Generation", {
    seed: { value: 42, step: 1 },
  });

  const data = useMemo(() => getFacadeLabData(seed), [seed]);

  const buildingOptions = useMemo(
    () =>
      Object.fromEntries(
        data.buildings.map((b, i) => [b.buildingId, i]),
      ),
    [data.buildings],
  );

  const { buildingIndex } = useControls("Selection", {
    buildingIndex: { options: buildingOptions },
  });

  const wallOptions = useMemo(() => {
    const building = data.buildings[buildingIndex];
    if (!building) return {};
    return Object.fromEntries(
      building.walls
        .filter((w) => w.isExposed)
        .map((w) => [`Wall ${w.wallIndex} (${w.length.toFixed(1)}m)`, w.wallIndex]),
    );
  }, [data.buildings, buildingIndex]);

  const { wallIndex } = useControls("Selection", {
    wallIndex: { options: wallOptions },
  });

  const { viewMode } = useControls("Display", {
    viewMode: {
      options: {
        Wireframe: "wireframe" as ViewMode,
        Rendered: "rendered" as ViewMode,
        Overlay: "overlay" as ViewMode,
      },
      value: "wireframe" as ViewMode,
    },
  });

  const view = useMemo(
    () => getWallFacadeView(seed, buildingIndex, wallIndex),
    [seed, buildingIndex, wallIndex],
  );

  // Info readout (read-only folder)
  useControls("Info", {
    bayCount: { value: view.bayCount, disabled: true },
    usableWidth: { value: `${view.usableWidth.toFixed(1)}m`, disabled: true, editable: false },
    floors: { value: view.floors.length, disabled: true },
    placements: { value: view.placements.length, disabled: true },
    elementsUsed: {
      value: Array.from(new Set(view.placements.map((p) => p.elementId))).join(", "),
      disabled: true,
      editable: false,
    },
  }, [view]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    renderFacade2D(ctx, view, viewMode, view.palette);
  }, [view, viewMode]);

  // Handle window resize
  useEffect(() => {
    const handler = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      renderFacade2D(ctx, view, viewMode, view.palette);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [view, viewMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-900">
      <Leva collapsed={false} titleBar={{ title: "Facade Lab" }} />
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
