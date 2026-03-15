import type { PlotConfig, PlotResult, Plot, Street, Vec2 } from "@/contracts";
import { createRng } from "@/utils";

function rect(x: number, z: number, w: number, d: number): Vec2[] {
  return [
    { x, z },
    { x: x + w, z },
    { x: x + w, z: z + d },
    { x, z: z + d },
  ];
}

function makePlot(
  row: "A" | "B",
  index: number,
  x: number,
  z: number,
  w: number,
  d: number,
): Plot {
  return {
    id: `plot-${row}${index + 1}`,
    footprint: rect(x, z, w, d),
    bounds: {
      min: { x, z },
      max: { x: x + w, z: z + d },
    },
    row,
  };
}

function subdivideRow(
  rng: () => number,
  streetLength: number,
  minWidth: number,
  maxWidth: number,
  rowLabel: "A" | "B",
  zStart: number,
  depth: number,
): Plot[] {
  const plots: Plot[] = [];
  let x = 0;
  let index = 0;

  while (x < streetLength) {
    const remaining = streetLength - x;

    // If remaining fits in one plot, take it all
    if (remaining <= maxWidth) {
      const w = Math.max(remaining, minWidth);
      plots.push(makePlot(rowLabel, index, x, zStart, w, depth));
      break;
    }

    // Pick a random width
    let w = minWidth + rng() * (maxWidth - minWidth);

    // If what's left after this plot would be too small, absorb it
    const afterThis = remaining - w;
    if (afterThis < minWidth) {
      w = remaining;
    }

    plots.push(makePlot(rowLabel, index, x, zStart, w, depth));
    x += w;
    index++;
  }

  return plots;
}

export function generatePlots(config: PlotConfig): PlotResult {
  const rng = createRng(config.seed);
  const halfStreet = config.streetWidth / 2;

  // Row A: above street (positive Z)
  const rowA = subdivideRow(
    rng,
    config.streetLength,
    config.minPlotWidth,
    config.maxPlotWidth,
    "A",
    halfStreet,
    config.plotDepth,
  );

  // Row B: below street (negative Z)
  const rowB = subdivideRow(
    rng,
    config.streetLength,
    config.minPlotWidth,
    config.maxPlotWidth,
    "B",
    -halfStreet - config.plotDepth,
    config.plotDepth,
  );

  const streets: Street[] = [
    {
      id: "street-1",
      start: { x: 0, z: 0 },
      end: { x: config.streetLength, z: 0 },
      width: config.streetWidth,
    },
  ];

  return { config, plots: [...rowA, ...rowB], streets };
}
