import type {
  FacadeConfig,
  FacadeResult,
  WallFacade,
  ElementPlacement,
  ElementDefinition,
  BayGridEntry,
  PlacementWarning,
  Vec3,
  FacadeLayout,
  FacadeLayoutElement,
} from "@/contracts";
import { createRng } from "@/utils";
import {
  computeElementBounds,
  type ElementBounds,
  resolveTilePlacement,
  getDefaultPlacementRule,
  verifyPlacement,
} from "@/core-geometry";
import { resolveBayGrid } from "./grammar-resolver";
import { mediterraneanGrammar } from "./presets";

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
  const grammar = config.grammar ?? mediterraneanGrammar;

  // Pre-compute bounds for all catalog elements
  const boundsMap = new Map<string, ElementBounds>();
  for (const el of config.availableElements) {
    boundsMap.set(el.elementId, computeElementBounds(el));
  }

  // Per-building RNG
  const buildingSeeds = new Map<string, () => number>();
  function getBuildingRng(buildingId: string): () => number {
    let rng = buildingSeeds.get(buildingId);
    if (!rng) {
      let hash = config.seed;
      for (let i = 0; i < buildingId.length; i++) {
        hash = (hash * 31 + buildingId.charCodeAt(i)) | 0;
      }
      rng = createRng(hash);
      buildingSeeds.set(buildingId, rng);
    }
    return rng;
  }

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
    const warnings: PlacementWarning[] = [];
    const layoutElements: FacadeLayoutElement[] = [];

    // Compute bays
    const usableWidth = wall.length - 2 * config.edgeMargin;
    if (usableWidth <= 0) {
      return {
        buildingId: wall.buildingId,
        wallIndex: wall.wallIndex,
        placements: [],
      };
    }

    const bayCount = Math.max(1, Math.round(usableWidth / config.bayWidth));
    const actualBayWidth = usableWidth / bayCount;

    // Wall direction
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;

    // rotationY from wall normal
    const rotationY = Math.atan2(wall.normal.x, wall.normal.z);

    const buildingRng = getBuildingRng(wall.buildingId);

    // Compute total height for layout
    const totalHeight =
      config.floors.length > 0
        ? config.floors[config.floors.length - 1].baseY +
          config.floors[config.floors.length - 1].height
        : 0;

    // --- Grammar resolution: WHAT goes where ---
    const resolvedGrid = resolveBayGrid(
      grammar,
      config.floors,
      bayCount,
      config.availableElements,
      buildingRng,
    );

    // --- Placement: HOW elements are positioned ---
    for (const cell of resolvedGrid) {
      const element = cell.element;
      const floor = config.floors.find((f) => f.floorIndex === cell.floorIndex);
      if (!floor) continue;

      if (!element) {
        warnings.push({
          floorIndex: cell.floorIndex,
          bayIndex: cell.bayIndex,
          elementId: "",
          type: "empty-bay",
        });
        continue;
      }

      // Compute bounds (may be a placeholder not in the pre-computed map)
      let rawBounds = boundsMap.get(element.elementId);
      if (!rawBounds) {
        rawBounds = computeElementBounds(element);
        boundsMap.set(element.elementId, rawBounds);
      }

      // Bay center offset along wall (wall-local)
      const u = config.edgeMargin + (cell.bayIndex + 0.5) * actualBayWidth;

      // Tile dimensions for this bay×floor cell
      const tile = { width: actualBayWidth, height: floor.height };

      // Compute scale FIRST so placement uses scaled bounds
      const scaleFactor = computeScale(rawBounds, actualBayWidth, floor.height);
      const s = scaleFactor ?? 1;
      const bounds = {
        ...rawBounds,
        width: rawBounds.width * s,
        height: rawBounds.height * s,
        depth: rawBounds.depth * s,
        offsetX: rawBounds.offsetX * s,
        offsetY: rawBounds.offsetY * s,
        offsetZ: rawBounds.offsetZ * s,
      };

      // Resolve placement using the anchor/origin model with scaled bounds
      const rule = getDefaultPlacementRule(element.type);
      const { localX, localY } = resolveTilePlacement(tile, bounds, rule);

      // Build FacadeLayoutElement (wall-local 2D coordinates)
      const layoutX = config.edgeMargin + (cell.bayIndex + 0.5) * actualBayWidth + bounds.offsetX;
      const layoutY = floor.baseY + localY + bounds.offsetY;

      layoutElements.push({
        elementId: element.elementId,
        elementType: element.type,
        floorIndex: cell.floorIndex,
        bayIndex: cell.bayIndex,
        x: layoutX,
        y: layoutY,
        width: bounds.width,
        height: bounds.height,
        scale: s,
      });

      // Transform to world space for backward compatibility
      const uNorm = u / wall.length;
      const normalOffset = 0.02;
      const position: Vec3 = {
        x: wall.start.x + uNorm * dx + wall.normal.x * normalOffset,
        y: floor.baseY + localY,
        z: wall.start.z + uNorm * dz + wall.normal.z * normalOffset,
      };

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
        floorIndex: cell.floorIndex,
        bayIndex: cell.bayIndex,
        elementId: element.elementId,
      });

      // Run containment verification with scaled bounds
      const placementWarnings = verifyPlacement(
        tile,
        bounds,
        { localX, localY },
        {
          floorIndex: cell.floorIndex,
          bayIndex: cell.bayIndex,
          elementId: element.elementId,
        },
      );
      warnings.push(...placementWarnings);
    }

    const layout: FacadeLayout = {
      wallLength: wall.length,
      totalHeight,
      bayWidth: actualBayWidth,
      edgeMargin: config.edgeMargin,
      bayCount,
      floors: config.floors.map((f) => ({
        floorIndex: f.floorIndex,
        baseY: f.baseY,
        height: f.height,
      })),
      elements: layoutElements,
      warnings,
      grammarId: grammar.grammarId,
    };

    return {
      buildingId: wall.buildingId,
      wallIndex: wall.wallIndex,
      placements,
      bayGrid,
      warnings,
      layout,
    };
  });

  return { config, facades };
}
