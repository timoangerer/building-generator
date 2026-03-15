import { describe, it, expect } from "vitest";
import type { z } from "zod";

type Invariant<T> = {
  name: string;
  check: (result: T) => boolean;
};

type TestGeneratorOptions<TConfig, TResult> = {
  name: string;
  generator: (config: TConfig) => TResult;
  schema: z.ZodType<TResult>;
  configFactory: (seed: number) => TConfig;
  invariants?: Invariant<TResult>[];
  seeds?: number[];
};

export function testGeneratorInvariants<TConfig, TResult>(
  options: TestGeneratorOptions<TConfig, TResult>
) {
  const seeds = options.seeds ?? [1, 42, 123, 999];

  describe(options.name, () => {
    for (const seed of seeds) {
      it(`validates against schema (seed=${seed})`, () => {
        const config = options.configFactory(seed);
        const result = options.generator(config);
        const parsed = options.schema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
      });
    }

    it("is deterministic (same seed → same output)", () => {
      const config = options.configFactory(42);
      const result1 = options.generator(config);
      const result2 = options.generator(config);
      expect(result1).toEqual(result2);
    });

    if (options.invariants) {
      for (const inv of options.invariants) {
        it(inv.name, () => {
          const config = options.configFactory(42);
          const result = options.generator(config);
          expect(inv.check(result)).toBe(true);
        });
      }
    }
  });
}
