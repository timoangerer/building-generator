import type { z } from "zod";

export type Invariant<T> = {
  name: string;
  check: (result: T) => boolean;
};

export type GeneratorFixture<TConfig, TResult> = {
  name: string;
  stage: string;
  generator: (config: TConfig) => TResult;
  schema: z.ZodType<TResult>;
  configFactory: (seed: number) => TConfig;
  seeds: number[];
  labels?: string[];
  invariants: Invariant<TResult>[];
};
