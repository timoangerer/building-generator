import { PlotResultSchema } from "@/contracts";
import { generatePlots } from "@/generators/plot";
import { noOverlaps } from "@/test-utils";
import type { PlotConfig, PlotResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

export const plotFixture: GeneratorFixture<PlotConfig, PlotResult> = {
  name: "generatePlots",
  stage: "plot",
  generator: generatePlots,
  schema: PlotResultSchema,
  configFactory: (seed): PlotConfig => ({
    seed,
    streetLength: 30,
    streetWidth: 6,
    plotDepth: 15,
    minPlotWidth: 8,
    maxPlotWidth: 14,
  }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "all plots are valid rectangles with 4 vertices",
      check: (r) =>
        r.plots.every((p) => {
          if (p.footprint.length !== 4) return false;
          const xs = p.footprint.map((v) => v.x);
          const zs = p.footprint.map((v) => v.z);
          const w = Math.max(...xs) - Math.min(...xs);
          const d = Math.max(...zs) - Math.min(...zs);
          return w > 0 && d > 0;
        }),
    },
    {
      name: "no plots overlap",
      check: (r) => {
        const rects = r.plots.map((p) => ({
          x: p.bounds.min.x,
          z: p.bounds.min.z,
          width: p.bounds.max.x - p.bounds.min.x,
          depth: p.bounds.max.z - p.bounds.min.z,
        }));
        return noOverlaps(rects);
      },
    },
    {
      name: "plot widths are within [minPlotWidth, maxPlotWidth] (except possibly last)",
      check: (r) => {
        const rowA = r.plots.filter((p) => p.row === "A");
        const rowB = r.plots.filter((p) => p.row === "B");

        for (const row of [rowA, rowB]) {
          for (let i = 0; i < row.length - 1; i++) {
            const w = row[i].bounds.max.x - row[i].bounds.min.x;
            if (w < r.config.minPlotWidth - 0.001 || w > r.config.maxPlotWidth + 0.001)
              return false;
          }
        }
        return true;
      },
    },
    {
      name: "both rows are populated",
      check: (r) => {
        const hasA = r.plots.some((p) => p.row === "A");
        const hasB = r.plots.some((p) => p.row === "B");
        return hasA && hasB;
      },
    },
    {
      name: "plots fill street length in each row",
      check: (r) => {
        for (const row of ["A", "B"] as const) {
          const rowPlots = r.plots.filter((p) => p.row === row);
          const totalWidth = rowPlots.reduce(
            (sum, p) => sum + (p.bounds.max.x - p.bounds.min.x),
            0,
          );
          if (Math.abs(totalWidth - r.config.streetLength) > 0.001) return false;
        }
        return true;
      },
    },
    {
      name: "row A plots are above the street",
      check: (r) => {
        const halfStreet = r.config.streetWidth / 2;
        return r.plots
          .filter((p) => p.row === "A")
          .every((p) => p.bounds.min.z >= halfStreet - 0.001);
      },
    },
    {
      name: "row B plots are below the street",
      check: (r) => {
        const halfStreet = r.config.streetWidth / 2;
        return r.plots
          .filter((p) => p.row === "B")
          .every((p) => p.bounds.max.z <= -halfStreet + 0.001);
      },
    },
  ],
};
