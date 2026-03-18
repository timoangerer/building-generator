import type { PlacementWarning, PlacementWarningType } from "@/contracts";
import type { ElementBounds } from "./element-bounds";
import type { TileRect } from "./tile-placement";

const DEFAULT_TOLERANCE = 0.02;

/**
 * Verify that a placed element fits within its tile boundaries.
 *
 * @param tile - The tile rect (width × height)
 * @param bounds - The element's bounding box dimensions
 * @param position - The element's resolved local position (geometry origin in tile coords)
 * @param context - Floor/bay/element identifiers for the warning
 * @param tolerance - Allowable overflow in meters (default 0.02m)
 * @returns Array of PlacementWarning for any edge overflow
 */
export function verifyPlacement(
  tile: TileRect,
  bounds: ElementBounds,
  position: { localX: number; localY: number },
  context: { floorIndex: number; bayIndex: number; elementId: string },
  tolerance: number = DEFAULT_TOLERANCE,
): PlacementWarning[] {
  const warnings: PlacementWarning[] = [];

  // Element bbox edges in tile-local coords, accounting for offset
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;

  const left = position.localX + bounds.offsetX - halfW;
  const right = position.localX + bounds.offsetX + halfW;
  const bottom = position.localY + bounds.offsetY - halfH;
  const top = position.localY + bounds.offsetY + halfH;

  const edges: { overflow: number; type: PlacementWarningType }[] = [
    { overflow: top - tile.height, type: "overflow-top" },
    { overflow: -bottom, type: "overflow-bottom" },
    { overflow: -left, type: "overflow-left" },
    { overflow: right - tile.width, type: "overflow-right" },
  ];

  for (const edge of edges) {
    if (edge.overflow > tolerance) {
      warnings.push({
        floorIndex: context.floorIndex,
        bayIndex: context.bayIndex,
        elementId: context.elementId,
        type: edge.type,
        overflowAmount: edge.overflow,
      });
    }
  }

  return warnings;
}
