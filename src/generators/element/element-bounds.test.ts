import { describe, it, expect } from "vitest";
import { computeElementBounds } from "./element-bounds";
import { generateElementCatalog } from "./element-generator";
import type { ElementDefinition, Vec3 } from "@/contracts";

function pos(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

const catalog = generateElementCatalog({ seed: 1 });
function getElement(id: string): ElementDefinition {
  return catalog.elements.find((e) => e.elementId === id)!;
}

describe("computeElementBounds", () => {
  it("single box part returns part dimensions", () => {
    const el: ElementDefinition = {
      elementId: "test-box",
      type: "window",
      geometry: {
        type: "composite",
        parts: [
          { shape: "box", dimensions: { width: 0.6, height: 1.3, depth: 0.08 }, role: "frame", position: pos(0, 0, 0) },
        ],
      },
    };
    const bounds = computeElementBounds(el);
    expect(bounds.width).toBeCloseTo(0.6);
    expect(bounds.height).toBeCloseTo(1.3);
    expect(bounds.depth).toBeCloseTo(0.08);
  });

  it("multiple parts with offsets encompass all parts", () => {
    const el: ElementDefinition = {
      elementId: "test-offset",
      type: "window",
      geometry: {
        type: "composite",
        parts: [
          { shape: "box", dimensions: { width: 0.5, height: 1.0, depth: 0.03 }, role: "pane", position: pos(0, 0, 0) },
          { shape: "box", dimensions: { width: 0.15, height: 1.0, depth: 0.04 }, role: "shutter", position: pos(-0.35, 0, 0) },
          { shape: "box", dimensions: { width: 0.15, height: 1.0, depth: 0.04 }, role: "shutter", position: pos(0.35, 0, 0) },
        ],
      },
    };
    const bounds = computeElementBounds(el);
    // Shutters at ±0.35, width 0.15 → extent from -0.425 to 0.425 = 0.85
    expect(bounds.width).toBeCloseTo(0.85);
    expect(bounds.height).toBeCloseTo(1.0);
  });

  it("sill overhang extends width on window-tall", () => {
    const bounds = computeElementBounds(getElement("window-tall"));
    // Sill is 0.7w (wider than 0.6w frame)
    expect(bounds.width).toBeGreaterThanOrEqual(0.7);
  });

  it("cylinder part bounds span 2*radius in width/depth", () => {
    const el: ElementDefinition = {
      elementId: "test-cyl",
      type: "window",
      geometry: {
        type: "composite",
        parts: [
          { shape: "cylinder", dimensions: { radius: 0.25, height: 0.03 }, role: "col", position: pos(0, 0, 0) },
        ],
      },
    };
    const bounds = computeElementBounds(el);
    expect(bounds.width).toBeCloseTo(0.5);
    expect(bounds.height).toBeCloseTo(0.03);
    expect(bounds.depth).toBeCloseTo(0.5);
  });

  it("half_cylinder bounds: 2*radius width, radius height", () => {
    const el: ElementDefinition = {
      elementId: "test-hc",
      type: "window",
      geometry: {
        type: "composite",
        parts: [
          { shape: "half_cylinder", dimensions: { radius: 0.25, depth: 0.03 }, role: "arch", position: pos(0, 0, 0) },
        ],
      },
    };
    const bounds = computeElementBounds(el);
    expect(bounds.width).toBeCloseTo(0.5);
    expect(bounds.height).toBeCloseTo(0.25);
    expect(bounds.depth).toBeCloseTo(0.03);
  });

  it("all catalog elements have positive dimensions", () => {
    for (const el of catalog.elements) {
      const bounds = computeElementBounds(el);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      expect(bounds.depth).toBeGreaterThan(0);
    }
  });

  it("box geometry type returns box dimensions directly", () => {
    const el: ElementDefinition = {
      elementId: "test-box-geom",
      type: "window",
      geometry: { type: "box", box: { width: 0.8, height: 1.0, depth: 0.1 } },
    };
    const bounds = computeElementBounds(el);
    expect(bounds.width).toBeCloseTo(0.8);
    expect(bounds.height).toBeCloseTo(1.0);
    expect(bounds.depth).toBeCloseTo(0.1);
  });
});
