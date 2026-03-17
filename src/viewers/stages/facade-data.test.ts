import { describe, it, expect } from "vitest";
import { getFacadeLabData, getWallFacadeView } from "./facade-data";

describe("facade-lab data-source", () => {
  it("getFacadeLabData returns buildings with walls", () => {
    const data = getFacadeLabData(42);
    expect(data.buildings.length).toBeGreaterThan(0);
    for (const b of data.buildings) {
      expect(b.wallCount).toBeGreaterThan(0);
      expect(b.walls.length).toBe(b.wallCount);
    }
  });

  it("getWallFacadeView is deterministic", () => {
    const v1 = getWallFacadeView(42, 0, 0);
    const v2 = getWallFacadeView(42, 0, 0);
    expect(v1.placements).toEqual(v2.placements);
    expect(v1.bayCount).toBe(v2.bayCount);
    expect(v1.usableWidth).toBe(v2.usableWidth);
  });

  it("getWallFacadeView returns valid structure", () => {
    const view = getWallFacadeView(42, 0, 0);
    expect(view.wall).toBeDefined();
    expect(view.floors.length).toBeGreaterThan(0);
    expect(view.bayWidth).toBeGreaterThan(0);
    expect(view.edgeMargin).toBeGreaterThanOrEqual(0);
    expect(view.elementCatalog.size).toBeGreaterThan(0);
    expect(view.elementBounds.size).toBeGreaterThan(0);
    expect(view.palette).toBeDefined();
  });

  it("bay count matches usable width / bay width", () => {
    const view = getWallFacadeView(42, 0, 0);
    const expected = Math.floor(view.usableWidth / view.bayWidth);
    expect(view.bayCount).toBe(expected);
    expect(view.usableWidth).toBeCloseTo(
      view.wall.length - 2 * view.edgeMargin,
    );
  });
});
