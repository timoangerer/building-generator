import { describe, it, expect } from "vitest";
import type { z } from "zod";
import type { GeneratorFixture, Invariant } from "@/test-fixtures/types";

type TestGeneratorOptions<TConfig, TResult> = {
  name: string;
  generator: (config: TConfig) => TResult;
  schema: z.ZodType<TResult>;
  configFactory: (seed: number) => TConfig;
  invariants?: Invariant<TResult>[];
  seeds?: number[];
};

export function testGeneratorInvariants<TConfig, TResult>(
  options: TestGeneratorOptions<TConfig, TResult> | GeneratorFixture<TConfig, TResult>
) {
  const name = options.name;
  const generator = options.generator;
  const schema = options.schema;
  const configFactory = options.configFactory;
  const seeds = options.seeds ?? [1, 42, 123, 999];
  const invariants = options.invariants;

  describe(name, () => {
    for (const seed of seeds) {
      it(`validates against schema (seed=${seed})`, () => {
        const config = configFactory(seed);
        const result = generator(config);
        const parsed = schema.safeParse(result);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed: ${JSON.stringify(parsed.error.issues, null, 2)}`
          );
        }
      });
    }

    it("is deterministic (same seed → same output)", () => {
      const config = configFactory(42);
      const result1 = generator(config);
      const result2 = generator(config);
      expect(result1).toEqual(result2);
    });

    if (invariants) {
      for (const inv of invariants) {
        it(inv.name, () => {
          const config = configFactory(42);
          const result = generator(config);
          expect(inv.check(result)).toBe(true);
        });
      }
    }
  });
}
