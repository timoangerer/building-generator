import { SceneResultSchema } from "@/contracts";
import { runCityPipeline } from "@/orchestrator";
import type { SceneResult } from "@/contracts";
import type { GeneratorFixture } from "./types";

type PipelineConfig = { seed: number };

export const pipelineFixture: GeneratorFixture<PipelineConfig, SceneResult> = {
  name: "runCityPipeline",
  stage: "pipeline",
  generator: (config) => runCityPipeline(config.seed),
  schema: SceneResultSchema,
  configFactory: (seed): PipelineConfig => ({ seed }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "contains buildings and streets",
      check: (r) =>
        r.scene.buildings.length > 0 && r.scene.streets.length > 0,
    },
  ],
};
