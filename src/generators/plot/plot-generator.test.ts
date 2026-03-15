import { PlotResultSchema } from "@/contracts/plot.schema";
import { generatePlots } from "./plot-generator";
import { testGeneratorInvariants } from "@/test-utils";
import type { PlotConfig } from "@/contracts";

testGeneratorInvariants({
  name: "generatePlots",
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
  invariants: [
    {
      name: "returns at least 2 plots",
      check: (r) => r.plots.length >= 2,
    },
    {
      name: "returns at least 1 street",
      check: (r) => r.streets.length >= 1,
    },
  ],
});
