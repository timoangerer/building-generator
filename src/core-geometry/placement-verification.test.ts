import { describe, it, expect } from "vitest";
import { verifyPlacement } from "./placement-verification";
import type { ElementBounds } from "./element-bounds";

const ctx = { floorIndex: 0, bayIndex: 0, elementId: "test-el" };

const zeroBounds = (w: number, h: number): ElementBounds => ({
  width: w,
  height: h,
  depth: 0.1,
  offsetX: 0,
  offsetY: 0,
  offsetZ: 0,
});

describe("verifyPlacement", () => {
  it("element within bounds produces no warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // Centered: localX = 1.25, localY = 1.5
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 1.5 },
      ctx,
    );
    expect(warnings).toEqual([]);
  });

  it("element overflowing top produces overflow-top warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localY = 2.5 → top edge at 2.5 + 0.75 = 3.25, overflow = 0.25
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 2.5 },
      ctx,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("overflow-top");
    expect(warnings[0].overflowAmount).toBeCloseTo(0.25);
  });

  it("element overflowing bottom produces overflow-bottom warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localY = 0.5 → bottom edge at 0.5 - 0.75 = -0.25, overflow = 0.25
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 0.5 },
      ctx,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("overflow-bottom");
    expect(warnings[0].overflowAmount).toBeCloseTo(0.25);
  });

  it("element overflowing left produces overflow-left warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localX = 0.3 → left edge at 0.3 - 0.5 = -0.2, overflow = 0.2
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 0.3, localY: 1.5 },
      ctx,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("overflow-left");
    expect(warnings[0].overflowAmount).toBeCloseTo(0.2);
  });

  it("element overflowing right produces overflow-right warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localX = 2.3 → right edge at 2.3 + 0.5 = 2.8, overflow = 0.3
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 2.3, localY: 1.5 },
      ctx,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].type).toBe("overflow-right");
    expect(warnings[0].overflowAmount).toBeCloseTo(0.3);
  });

  it("overflow within tolerance produces no warning", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localY = 2.26 → top edge at 2.26 + 0.75 = 3.01, overflow = 0.01
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 2.26 },
      ctx,
      0.02,
    );
    expect(warnings).toEqual([]);
  });

  it("overflow exceeding tolerance produces warning with correct amount", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    // localY = 2.3 → top edge at 2.3 + 0.75 = 3.05, overflow = 0.05
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 2.3 },
      ctx,
      0.02,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0].overflowAmount).toBeCloseTo(0.05);
  });

  it("warning contains all required fields", () => {
    const tile = { width: 2.5, height: 3.0 };
    const bounds = zeroBounds(1.0, 1.5);
    const warnings = verifyPlacement(
      tile,
      bounds,
      { localX: 1.25, localY: 2.5 },
      { floorIndex: 1, bayIndex: 2, elementId: "balcony-door-iron" },
    );
    expect(warnings[0]).toEqual({
      floorIndex: 1,
      bayIndex: 2,
      elementId: "balcony-door-iron",
      type: "overflow-top",
      overflowAmount: expect.closeTo(0.25),
    });
  });
});
