import type {
  FacadeConfig,
  FacadeResult,
  WallFacade,
  ElementPlacement,
  ElementDefinition,
  BayGridEntry,
  Vec3,
} from "@/contracts";
import { createRng } from "@/utils";
import { computeElementBounds, type ElementBounds } from "@/core-geometry";

const SILL_HEIGHT = 0.9;

function categorizeElements(elements: ElementDefinition[]) {
  const windows: ElementDefinition[] = [];
  const entryDoors: ElementDefinition[] = [];
  const balconyDoors: ElementDefinition[] = [];

  for (const el of elements) {
    if (el.type === "window") {
      windows.push(el);
    } else if (el.type === "door") {
      if (el.elementId.startsWith("balcony-")) {
        balconyDoors.push(el);
      } else {
        entryDoors.push(el);
      }
    }
  }

  return { windows, entryDoors, balconyDoors };
}

function pickRng<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function computeScale(
  bounds: ElementBounds,
  bayWidth: number,
  floorHeight: number,
): number | undefined {
  const maxW = (bayWidth * 0.8) / bounds.width;
  const maxH = (floorHeight * 0.7) / bounds.height;
  const s = Math.min(maxW, maxH, 1.5);
  return s > 1.05 ? s : undefined;
}

export function generateFacade(config: FacadeConfig): FacadeResult {
  const { windows, entryDoors, balconyDoors } = categorizeElements(
    config.availableElements,
  );

  // Pre-compute bounds for all elements
  const boundsMap = new Map<string, ElementBounds>();
  for (const el of config.availableElements) {
    boundsMap.set(el.elementId, computeElementBounds(el));
  }

  // Per-building RNG for element selection
  const buildingSeeds = new Map<string, () => number>();
  function getBuildingRng(buildingId: string): () => number {
    let rng = buildingSeeds.get(buildingId);
    if (!rng) {
      // Hash the buildingId to get a deterministic sub-seed
      let hash = config.seed;
      for (let i = 0; i < buildingId.length; i++) {
        hash = (hash * 31 + buildingId.charCodeAt(i)) | 0;
      }
      rng = createRng(hash);
      buildingSeeds.set(buildingId, rng);
    }
    return rng;
  }

  // Per-building primary/accent window selection cache
  const buildingWindowChoice = new Map<
    string,
    { primary: ElementDefinition; accent: ElementDefinition }
  >();

  function getBuildingWindows(buildingId: string) {
    let choice = buildingWindowChoice.get(buildingId);
    if (!choice) {
      const rng = getBuildingRng(buildingId);
      if (windows.length === 0) return null;
      const primary = pickRng(windows, rng);
      // Pick accent that differs from primary if possible
      let accent = pickRng(windows, rng);
      if (accent.elementId === primary.elementId && windows.length > 1) {
        const others = windows.filter(
          (w) => w.elementId !== primary.elementId,
        );
        accent = pickRng(others, rng);
      }
      choice = { primary, accent };
      buildingWindowChoice.set(buildingId, choice);
    }
    return choice;
  }

  const smallSqWindow = config.availableElements.find(
    (e) => e.elementId === "window-small-sq",
  );

  const facades: WallFacade[] = config.walls.map((wall) => {
    // Skip party walls
    if (wall.neighborBuildingId) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    const placements: ElementPlacement[] = [];
    const bayGrid: BayGridEntry[] = [];

    // Compute bays
    const usableWidth = wall.length - 2 * config.edgeMargin;
    if (usableWidth <= 0) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    const bayCount = Math.floor(usableWidth / config.bayWidth);
    if (bayCount === 0) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    // Wall direction
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;

    // rotationY from wall normal
    const rotationY = Math.atan2(wall.normal.x, wall.normal.z);

    // Center bay index for door placement
    const centerBay = Math.floor(bayCount / 2);

    const buildingWindows = getBuildingWindows(wall.buildingId);
    const buildingRng = getBuildingRng(wall.buildingId);

    // Pick an entry door for this wall
    const entryDoor =
      entryDoors.length > 0 ? pickRng(entryDoors, buildingRng) : null;

    const floorCount = config.floors.length;

    for (const floor of config.floors) {
      const isGround = floor.floorIndex === 0;
      const isTop = floor.floorIndex === floorCount - 1 && floorCount >= 3;
      const isMiddle = !isGround && !isTop;

      // For middle floors, pick 1-2 accent bay indices
      let accentBays: Set<number> | null = null;
      if (isMiddle && bayCount >= 2 && buildingWindows) {
        accentBays = new Set<number>();
        const numAccent = Math.min(
          1 + Math.floor(buildingRng() * 2),
          bayCount - 1,
        );
        for (let a = 0; a < numAccent; a++) {
          accentBays.add(Math.floor(buildingRng() * bayCount));
        }
      }

      for (let bay = 0; bay < bayCount; bay++) {
        // Determine which element to place
        let element: ElementDefinition | null = null;

        if (isGround && bay === centerBay && entryDoor) {
          element = entryDoor;
        } else if (isGround) {
          element = buildingWindows?.primary ?? null;
        } else if (isTop && smallSqWindow && buildingRng() < 0.3) {
          element = smallSqWindow;
        } else if (isMiddle && accentBays?.has(bay)) {
          // Accent bay: use accent window or balcony door
          if (balconyDoors.length > 0 && buildingRng() < 0.3) {
            element = pickRng(balconyDoors, buildingRng);
          } else {
            element = buildingWindows?.accent ?? null;
          }
        } else {
          element = buildingWindows?.primary ?? null;
        }

        if (!element) continue;

        const bounds = boundsMap.get(element.elementId);
        if (!bounds) continue;

        // Bay center offset along wall
        const u = config.edgeMargin + (bay + 0.5) * config.bayWidth;
        const uNorm = u / wall.length;

        // Y-position: doors bottom at floor base, windows sill at ~0.9m
        const isDoor = element.type === "door";
        const y = isDoor
          ? floor.baseY + bounds.height / 2
          : floor.baseY + SILL_HEIGHT + bounds.height / 2;

        // World position
        const normalOffset = 0.02;
        const position: Vec3 = {
          x: wall.start.x + uNorm * dx + wall.normal.x * normalOffset,
          y,
          z: wall.start.z + uNorm * dz + wall.normal.z * normalOffset,
        };

        // Optional proportional scaling
        const scaleFactor = computeScale(bounds, config.bayWidth, floor.height);

        const placement: ElementPlacement = {
          elementId: element.elementId,
          position,
          rotationY,
        };

        if (scaleFactor !== undefined) {
          placement.scale = { x: scaleFactor, y: scaleFactor, z: scaleFactor };
        }

        placements.push(placement);

        bayGrid.push({
          floorIndex: floor.floorIndex,
          bayIndex: bay,
          elementId: element.elementId,
        });
      }
    }

    return {
      buildingId: wall.buildingId,
      wallIndex: wall.wallIndex,
      placements,
      bayGrid,
    };
  });

  return { config, facades };
}
