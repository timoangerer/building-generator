import { describe, it, expect } from "vitest";
import {
  resolveTilePlacement,
  resolveAnchorPoint,
  getDefaultPlacementRule,
} from "./tile-placement";
import type { Anchor } from "@/contracts";
import type { ElementBounds } from "./element-bounds";

const zeroBounds = (w: number, h: number): ElementBounds => ({
  width: w,
  height: h,
  depth: 0.1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
});

describe("resolveAnchorPoint", () => {
  const rect = { width: 4, height: 2 };

  const expected: Record<Anchor, { x: number; y: number }> = {
    "top-left": { x: 0, y: 2 },
    "top-center": { x: 2, y: 2 },
    "top-right": { x: 4, y: 2 },
    "middle-left": { x: 0, y: 1 },
    center: { x: 2, y: 1 },
    "middle-right": { x: 4, y: 1 },
    "bottom-left": { x: 0, y: 0 },
    "bottom-center": { x: 2, y: 0 },
    "bottom-right": { x: 4, y: 0 },
  };

  for (const [anchor, exp] of Object.entries(expected)) {
    it(`resolves "${anchor}" to (${exp.x}, ${exp.y})`, () => {
      expect(resolveAnchorPoint(anchor as Anchor, rect)).toEqual(exp);
    });
  }
});

describe("resolveTilePlacement", () => {
  it("center anchor + center origin → element centered in tile", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    const result = resolveTilePlacement(tile, bounds, {
      anchor: "center",
      origin: "center",
    });
    expect(result.localX).toBeCloseTo(1.25);
    expect(result.localY).toBeCloseTo(1.5);
  });

  it("bottom-center anchor + bottom-center origin → element bottom at tile bottom", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 2.0);
    const result = resolveTilePlacement(tile, bounds, {
      anchor: "bottom-center",
      origin: "bottom-center",
    });
    expect(result.localX).toBeCloseTo(1.25);
    expect(result.localY).toBeCloseTo(1.0); // bbox center = height/2
  });

  it("bottom-center anchor with offset", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(0.9, 1.6);
    const result = resolveTilePlacement(tile, bounds, {
      anchor: "bottom-center",
      origin: "bottom-center",
      offset: { x: 0, y: 0.9 },
    });
    expect(result.localX).toBeCloseTo(1.25);
    expect(result.localY).toBeCloseTo(1.7); // 0.8 (half height) + 0.9 (offset)
  });

  it("top-center anchor + top-center origin → element top at tile top", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    const result = resolveTilePlacement(tile, bounds, {
      anchor: "top-center",
      origin: "top-center",
    });
    expect(result.localX).toBeCloseTo(1.25);
    expect(result.localY).toBeCloseTo(2.25); // top - half height = 3 - 0.75
  });

  it("accounts for negative offsetY (bbox center above geometry origin)", () => {
    const bounds: ElementBounds = {
      width: 1.2,
      height: 2.24,
      depth: 0.2,
      offsetX: 0,
      offsetY: -0.5,
      offsetZ: 0,
    };
    const tile = { width: 2.5, height: 3.0 };
    const result = resolveTilePlacement(tile, bounds, {
      anchor: "bottom-center",
      origin: "bottom-center",
    });
    // Without offset: localY = 0 + height/2 = 1.12
    // With offsetY = -0.5: localY = 1.12 - (-0.5) = 1.62
    expect(result.localY).toBeCloseTo(1.62);
  });

  it("zero offset produces same result as no offset", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    const rule = { anchor: "center" as Anchor, origin: "center" as Anchor };
    const withZero = resolveTilePlacement(tile, bounds, {
      ...rule,
      offset: { x: 0, y: 0 },
    });
    const without = resolveTilePlacement(tile, bounds, rule);
    expect(withZero.localX).toBeCloseTo(without.localX);
    expect(withZero.localY).toBeCloseTo(without.localY);
  });

  it("repeated calls return same result (deterministic)", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    const rule = { anchor: "center" as Anchor, origin: "center" as Anchor };
    const a = resolveTilePlacement(tile, bounds, rule);
    const b = resolveTilePlacement(tile, bounds, rule);
    expect(a).toEqual(b);
  });
});

describe("getDefaultPlacementRule", () => {
  it("door → bottom-center, bottom-center", () => {
    const rule = getDefaultPlacementRule("door");
    expect(rule.anchor).toBe("bottom-center");
    expect(rule.origin).toBe("bottom-center");
    expect(rule.offset).toBeUndefined();
  });

  it("window → bottom-center with sill offset", () => {
    const rule = getDefaultPlacementRule("window");
    expect(rule.anchor).toBe("bottom-center");
    expect(rule.origin).toBe("bottom-center");
    expect(rule.offset).toEqual({ x: 0, y: 0.9 });
  });

  it("wall_panel → center, center", () => {
    const rule = getDefaultPlacementRule("wall_panel");
    expect(rule.anchor).toBe("center");
    expect(rule.origin).toBe("center");
  });
});
