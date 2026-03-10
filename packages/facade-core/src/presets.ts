import type { FacadeDefinition, FacadeMap } from "./types";

export const facadePresets = {
  classical: {
    name: "Classical",
    zones: [
      {
        key: "ground",
        height: 4.4,
        inset: 0.18,
        rows: [
          {
            height: 1,
            items: [
              {
                type: "door",
                widthRatio: 1.2,
                minWidth: 1.8,
                maxWidth: 2.4,
                frameDepth: 0.3,
                arch: true,
              },
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.5,
                maxWidth: 2.1,
                gap: 0.65,
                frameDepth: 0.18,
                sill: true,
                header: "pediment",
              },
            ],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.32, offsetY: 4.25 }],
      },
      {
        key: "middle",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            heightPerFloor: 3.25,
            items: [
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.4,
                maxWidth: 1.95,
                gap: 0.65,
                sill: true,
                header: "lintel",
              },
            ],
          },
        ],
      },
      {
        key: "top",
        height: 2.6,
        rows: [
          {
            height: 1,
            items: [
              {
                type: "oculus",
                repeatFit: true,
                minWidth: 1.2,
                maxWidth: 1.5,
                gap: 1.3,
              },
            ],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.42, offsetY: 0.15 }],
      },
    ],
  },
  modern: {
    name: "Modern",
    zones: [
      {
        key: "base",
        height: 4.2,
        inset: 0.26,
        rows: [
          {
            height: 1,
            items: [
              {
                type: "entry",
                widthRatio: 1.4,
                minWidth: 2,
                maxWidth: 2.8,
                frameDepth: 0.22,
              },
              {
                type: "glass",
                repeatFit: true,
                minWidth: 1.8,
                maxWidth: 2.4,
                gap: 0.35,
                frameDepth: 0.12,
              },
            ],
          },
        ],
      },
      {
        key: "stack",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            heightPerFloor: 3.35,
            items: [
              {
                type: "glass",
                repeatFit: true,
                minWidth: 1.9,
                maxWidth: 2.6,
                gap: 0.35,
                balcony: {
                  every: 2,
                  depth: 0.95,
                  railHeight: 1.05,
                },
              },
            ],
          },
        ],
      },
      {
        key: "crown",
        height: 2.1,
        rows: [
          {
            height: 1,
            items: [{ type: "screen", repeatFit: true, minWidth: 1.2, maxWidth: 1.8, gap: 0.2 }],
          },
        ],
      },
    ],
  },
  ornate: {
    name: "Ornate",
    zones: [
      {
        key: "base",
        height: 4.8,
        inset: 0.2,
        rows: [
          {
            height: 1,
            items: [
              { type: "door", widthRatio: 1.3, minWidth: 2, maxWidth: 2.6, arch: true, frameDepth: 0.28 },
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.4,
                maxWidth: 2.1,
                gap: 0.55,
                frameDepth: 0.18,
                sill: true,
                header: "arch",
              },
            ],
          },
        ],
        ornaments: [
          { type: "cornice", size: 0.36, offsetY: 4.55 },
          { type: "band", size: 0.2, offsetY: 3.1 },
        ],
      },
      {
        key: "residential",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            heightPerFloor: 3.15,
            items: [
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.35,
                maxWidth: 1.8,
                gap: 0.55,
                sill: true,
                header: "pediment",
                balcony: {
                  every: 3,
                  depth: 0.88,
                  railHeight: 1.0,
                },
              },
            ],
          },
        ],
      },
      {
        key: "attic",
        height: 2.8,
        rows: [
          {
            height: 1,
            items: [{ type: "oculus", repeatFit: true, minWidth: 1.0, maxWidth: 1.25, gap: 1.2 }],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.45, offsetY: 0.15 }],
      },
    ],
  },
} satisfies Record<string, FacadeDefinition>;

export const componentDescriptions: Record<string, string> = {
  balcony: "Projected slab generated from balcony repeat rules.",
  door: "Solid ground-floor opening with optional arch treatment.",
  entry: "Larger glazed or framed entrance element.",
  glass: "Full-height modern glazing bay.",
  oculus: "Circular attic or accent opening.",
  screen: "Screen or louver panel.",
  window: "Standard framed window bay with optional sill/header.",
};

export function createDefaultFacadeMap(): FacadeMap {
  return {
    north: structuredClone(facadePresets.classical),
    east: structuredClone(facadePresets.modern),
    south: structuredClone(facadePresets.ornate),
    west: structuredClone(facadePresets.classical),
    inner: structuredClone(facadePresets.modern),
  };
}
