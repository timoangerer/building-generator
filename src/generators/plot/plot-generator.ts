import type { PlotConfig, PlotResult, Plot, Street, Vec2 } from "@/contracts";

function rect(x: number, z: number, w: number, d: number): Vec2[] {
  return [
    { x, z },
    { x: x + w, z },
    { x: x + w, z: z + d },
    { x, z: z + d },
  ];
}

export function generatePlots(config: PlotConfig): PlotResult {
  const plots: Plot[] = [
    {
      id: "plot-A1",
      footprint: rect(0, 0, 10, config.plotDepth),
      bounds: {
        min: { x: 0, z: 0 },
        max: { x: 10, z: config.plotDepth },
      },
      row: "A",
    },
    {
      id: "plot-A2",
      footprint: rect(12, 0, 10, config.plotDepth),
      bounds: {
        min: { x: 12, z: 0 },
        max: { x: 22, z: config.plotDepth },
      },
      row: "A",
    },
    {
      id: "plot-B1",
      footprint: rect(0, config.plotDepth + config.streetWidth, 10, config.plotDepth),
      bounds: {
        min: { x: 0, z: config.plotDepth + config.streetWidth },
        max: { x: 10, z: config.plotDepth * 2 + config.streetWidth },
      },
      row: "B",
    },
  ];

  const streets: Street[] = [
    {
      id: "street-1",
      start: { x: 0, z: config.plotDepth },
      end: { x: config.streetLength, z: config.plotDepth },
      width: config.streetWidth,
    },
  ];

  return { config, plots, streets };
}
