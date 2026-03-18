import type { GeneratorFixture } from "@/test-fixtures";

export type { RenderOptions, StageRenderer, ToolRenderer } from "@/viewers";

export type InvariantResult = {
  name: string;
  passed: boolean;
};

export type WorkbenchState = {
  stage: string;
  seed: number;
  config: unknown;
  result: unknown;
  invariants: InvariantResult[];
};

export type FixtureSection = {
  kind: "fixture";
  stage: string;
  fixture: GeneratorFixture<unknown, unknown>;
};

export type ToolSection = {
  kind: "tool";
  id: string;
  label: string;
  items: { id: string; label: string }[];
};

export type WorkbenchSection = FixtureSection | ToolSection;
