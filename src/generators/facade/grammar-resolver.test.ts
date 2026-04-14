import { describe, it, expect } from "vitest";
import { resolveBayGrid } from "./grammar-resolver";
import type { FacadeGrammar, FloorInfo, ElementDefinition } from "@/contracts";
import { createRng } from "@/utils";

// Minimal test catalog
const testCatalog: ElementDefinition[] = [
  { elementId: "win-a", type: "window", geometry: { type: "box", box: { width: 0.9, height: 1.5, depth: 0.1 } } },
  { elementId: "win-b", type: "window", geometry: { type: "box", box: { width: 0.8, height: 1.2, depth: 0.1 } } },
  { elementId: "door-a", type: "door", geometry: { type: "box", box: { width: 1.0, height: 2.0, depth: 0.1 } } },
];

const threeFloors: FloorInfo[] = [
  { floorIndex: 0, baseY: 0, height: 3 },
  { floorIndex: 1, baseY: 3, height: 3 },
  { floorIndex: 2, baseY: 6, height: 3 },
];

const twoFloors: FloorInfo[] = [
  { floorIndex: 0, baseY: 0, height: 3 },
  { floorIndex: 1, baseY: 3, height: 3 },
];

describe("resolveBayGrid", () => {
  it("is deterministic (same seed = same result)", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "by-id", elementId: "win-a" }, weight: 1 },
              { slot: { kind: "by-id", elementId: "win-b" }, weight: 1 },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid1 = resolveBayGrid(grammar, threeFloors, 4, testCatalog, createRng(42));
    const grid2 = resolveBayGrid(grammar, threeFloors, 4, testCatalog, createRng(42));

    expect(grid1).toEqual(grid2);
  });

  it("different seeds produce different results (with weighted rules)", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "by-id", elementId: "win-a" }, weight: 1 },
              { slot: { kind: "by-id", elementId: "win-b" }, weight: 1 },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid1 = resolveBayGrid(grammar, threeFloors, 6, testCatalog, createRng(1));
    const grid2 = resolveBayGrid(grammar, threeFloors, 6, testCatalog, createRng(99));

    const ids1 = grid1.map((c) => c.element?.elementId);
    const ids2 = grid2.map((c) => c.element?.elementId);
    // With 18 cells and 50/50 weighting, it's extremely unlikely to match
    expect(ids1).not.toEqual(ids2);
  });

  it("matches ground floor correctly", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: "ground", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "door-a" } }] }] },
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, threeFloors, 3, testCatalog, createRng(1));

    // Ground floor (floorIndex 0) should have doors
    const groundCells = grid.filter((c) => c.floorIndex === 0);
    expect(groundCells.every((c) => c.element?.elementId === "door-a")).toBe(true);

    // Other floors should have windows
    const upperCells = grid.filter((c) => c.floorIndex > 0);
    expect(upperCells.every((c) => c.element?.elementId === "win-a")).toBe(true);
  });

  it("matches top floor correctly", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: "top", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] }] },
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, threeFloors, 3, testCatalog, createRng(1));

    const topCells = grid.filter((c) => c.floorIndex === 2);
    expect(topCells.every((c) => c.element?.elementId === "win-b")).toBe(true);

    const otherCells = grid.filter((c) => c.floorIndex < 2);
    expect(otherCells.every((c) => c.element?.elementId === "win-a")).toBe(true);
  });

  it("matches middle floors correctly", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: "middle", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] }] },
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, threeFloors, 3, testCatalog, createRng(1));

    const middleCells = grid.filter((c) => c.floorIndex === 1);
    expect(middleCells.every((c) => c.element?.elementId === "win-b")).toBe(true);
  });

  it("matches center bay position", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "center", rules: [{ slot: { kind: "by-id", elementId: "door-a" } }] },
            { position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    // 5 bays -> center = bay 2
    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 5, testCatalog, createRng(1));

    expect(grid[2].element?.elementId).toBe("door-a");
    expect(grid[0].element?.elementId).toBe("win-a");
    expect(grid[4].element?.elementId).toBe("win-a");
  });

  it("matches edge bay position", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "edges", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] },
            { position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 5, testCatalog, createRng(1));

    expect(grid[0].element?.elementId).toBe("win-b");
    expect(grid[4].element?.elementId).toBe("win-b");
    expect(grid[1].element?.elementId).toBe("win-a");
    expect(grid[2].element?.elementId).toBe("win-a");
    expect(grid[3].element?.elementId).toBe("win-a");
  });

  it("matches even/odd bay positions", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "even", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] },
            { position: "odd", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 4, testCatalog, createRng(1));

    expect(grid[0].element?.elementId).toBe("win-a"); // even
    expect(grid[1].element?.elementId).toBe("win-b"); // odd
    expect(grid[2].element?.elementId).toBe("win-a"); // even
    expect(grid[3].element?.elementId).toBe("win-b"); // odd
  });

  it("handles mirror symmetry", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      symmetry: "mirror",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "by-id", elementId: "win-a" }, weight: 1 },
              { slot: { kind: "by-id", elementId: "win-b" }, weight: 1 },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    // 6 bays with mirror: bays 0-2 resolved, then mirrored to 3-5
    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 6, testCatalog, createRng(42));

    expect(grid[0].element?.elementId).toBe(grid[5].element?.elementId);
    expect(grid[1].element?.elementId).toBe(grid[4].element?.elementId);
    expect(grid[2].element?.elementId).toBe(grid[3].element?.elementId);
  });

  it("handles mirror symmetry with odd bay count", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      symmetry: "mirror",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "by-id", elementId: "win-a" }, weight: 1 },
              { slot: { kind: "by-id", elementId: "win-b" }, weight: 1 },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    // 5 bays: bays 0-2 resolved (center=2), then mirror: 3=1, 4=0
    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 5, testCatalog, createRng(42));

    expect(grid[0].element?.elementId).toBe(grid[4].element?.elementId);
    expect(grid[1].element?.elementId).toBe(grid[3].element?.elementId);
  });

  it("creates placeholder elements", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "placeholder", label: "pilaster", width: 0.4, height: 2.8 } },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "empty" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 3, testCatalog, createRng(1));

    expect(grid.every((c) => c.element !== null)).toBe(true);
    expect(grid[0].element!.elementId).toBe("placeholder:pilaster");
    expect(grid[0].element!.type).toBe("wall_panel");
    expect(grid[0].element!.geometry).toEqual({
      type: "box",
      box: { width: 0.4, height: 2.8, depth: 0.05 },
    });
  });

  it("reuses the same placeholder element definition for identical labels", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [
              { slot: { kind: "placeholder", label: "pilaster", width: 0.4, height: 2.8 } },
            ] },
          ],
        },
      ],
      defaultSlot: { kind: "empty" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 3, testCatalog, createRng(1));

    // All three cells should reference the exact same object
    expect(grid[0].element).toBe(grid[1].element);
    expect(grid[1].element).toBe(grid[2].element);
  });

  it("handles empty slots", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [{ slot: { kind: "empty" } }] },
          ],
        },
      ],
      defaultSlot: { kind: "empty" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 3, testCatalog, createRng(1));

    expect(grid.every((c) => c.element === null)).toBe(true);
  });

  it("falls back to defaultSlot when by-id element not found", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        {
          match: "all",
          bayPattern: [
            { position: "all", rules: [{ slot: { kind: "by-id", elementId: "nonexistent" } }] },
          ],
        },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, [{ floorIndex: 0, baseY: 0, height: 3 }], 2, testCatalog, createRng(1));

    expect(grid.every((c) => c.element?.elementId === "win-a")).toBe(true);
  });

  it("covers all floor/bay cells", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, threeFloors, 4, testCatalog, createRng(1));

    expect(grid.length).toBe(3 * 4); // 3 floors × 4 bays
    // Verify all indices covered
    for (let f = 0; f < 3; f++) {
      for (let b = 0; b < 4; b++) {
        const cell = grid.find((c) => c.floorIndex === f && c.bayIndex === b);
        expect(cell).toBeDefined();
      }
    }
  });

  it("uses floor index match", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: { index: 1 }, bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] }] },
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    const grid = resolveBayGrid(grammar, threeFloors, 2, testCatalog, createRng(1));

    const floor1 = grid.filter((c) => c.floorIndex === 1);
    expect(floor1.every((c) => c.element?.elementId === "win-b")).toBe(true);

    const otherFloors = grid.filter((c) => c.floorIndex !== 1);
    expect(otherFloors.every((c) => c.element?.elementId === "win-a")).toBe(true);
  });

  it("top floor only matches when 2+ floors", () => {
    const grammar: FacadeGrammar = {
      grammarId: "test",
      name: "Test",
      floorRules: [
        { match: "top", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-b" } }] }] },
        { match: "all", bayPattern: [{ position: "all", rules: [{ slot: { kind: "by-id", elementId: "win-a" } }] }] },
      ],
      defaultSlot: { kind: "by-id", elementId: "win-a" },
    };

    // Single floor: "top" should NOT match (need 2+ floors)
    const singleFloor = [{ floorIndex: 0, baseY: 0, height: 3 }];
    const grid1 = resolveBayGrid(grammar, singleFloor, 2, testCatalog, createRng(1));
    expect(grid1.every((c) => c.element?.elementId === "win-a")).toBe(true);

    // Two floors: "top" matches floor 1
    const grid2 = resolveBayGrid(grammar, twoFloors, 2, testCatalog, createRng(1));
    const topCells = grid2.filter((c) => c.floorIndex === 1);
    expect(topCells.every((c) => c.element?.elementId === "win-b")).toBe(true);
  });
});
