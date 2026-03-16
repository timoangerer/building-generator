export type { Invariant, GeneratorFixture } from "./types";
export { plotFixture } from "./plot-fixtures";
export { massingFixture } from "./massing-fixtures";
export { elementFixture } from "./element-fixtures";
export { facadeFixture } from "./facade-fixtures";
export { buildingFixture } from "./building-fixtures";
export { pipelineFixture } from "./pipeline-fixtures";

import type { GeneratorFixture } from "./types";
import { plotFixture } from "./plot-fixtures";
import { massingFixture } from "./massing-fixtures";
import { elementFixture } from "./element-fixtures";
import { facadeFixture } from "./facade-fixtures";
import { buildingFixture } from "./building-fixtures";
import { pipelineFixture } from "./pipeline-fixtures";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allFixtures: GeneratorFixture<any, any>[] = [
  plotFixture,
  massingFixture,
  elementFixture,
  facadeFixture,
  buildingFixture,
  pipelineFixture,
];
