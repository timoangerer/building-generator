import { describe, it, expect } from "vitest";
import { SceneResultSchema } from "@/contracts/scene.schema";
import { runCityPipeline } from "./city-pipeline";

describe("runCityPipeline", () => {
  it("produces valid SceneResult (seed=42)", () => {
    const result = runCityPipeline(42);
    const parsed = SceneResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.issues, null, 2));
    }
  });

  it("produces valid SceneResult (seed=123)", () => {
    const result = runCityPipeline(123);
    const parsed = SceneResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new Error(JSON.stringify(parsed.error.issues, null, 2));
    }
  });

  it("is deterministic", () => {
    const r1 = runCityPipeline(42);
    const r2 = runCityPipeline(42);
    expect(r1).toEqual(r2);
  });

  it("contains buildings and streets", () => {
    const result = runCityPipeline(42);
    expect(result.scene.buildings.length).toBeGreaterThan(0);
    expect(result.scene.streets.length).toBeGreaterThan(0);
  });
});
