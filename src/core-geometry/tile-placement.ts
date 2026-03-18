import type { Anchor, PlacementRule, ElementType } from "@/contracts";
import type { ElementBounds } from "./element-bounds";

export type TileRect = {
  width: number;
  height: number;
};

const SILL_HEIGHT = 0.9;

/**
 * Resolve a named anchor position to (x, y) coordinates on a rectangle.
 * Origin is bottom-left: x increases rightward, y increases upward.
 */
export function resolveAnchorPoint(
  anchor: Anchor,
  rect: { width: number; height: number },
): { x: number; y: number } {
  let x: number;
  let y: number;

  // Horizontal
  if (anchor.includes("left")) {
    x = 0;
  } else if (anchor.includes("right")) {
    x = rect.width;
  } else {
    x = rect.width / 2;
  }

  // Vertical
  if (anchor.startsWith("top")) {
    y = rect.height;
  } else if (anchor.startsWith("bottom")) {
    y = 0;
  } else {
    y = rect.height / 2;
  }

  return { x, y };
}

/**
 * Get the default placement rule for an element type.
 */
export function getDefaultPlacementRule(elementType: ElementType): PlacementRule {
  switch (elementType) {
    case "door":
      return { anchor: "bottom-center", origin: "bottom-center" };
    case "window":
      return {
        anchor: "bottom-center",
        origin: "bottom-center",
        offset: { x: 0, y: SILL_HEIGHT },
      };
    case "wall_panel":
      return { anchor: "center", origin: "center" };
  }
}

/**
 * Resolve the local position of an element within a tile.
 *
 * Returns the position of the element's geometry origin (center of bbox when
 * offset is zero) in tile-local coordinates where (0,0) is the tile's bottom-left.
 *
 * The anchor point on the tile is aligned to the origin point on the element's
 * bounding box, then the optional offset is applied.
 */
export function resolveTilePlacement(
  tile: TileRect,
  bounds: ElementBounds,
  rule: PlacementRule,
): { localX: number; localY: number } {
  // Where on the tile to place the reference point
  const anchorPt = resolveAnchorPoint(rule.anchor, tile);

  // Where on the element bbox the reference point is
  const originPt = resolveAnchorPoint(rule.origin, {
    width: bounds.width,
    height: bounds.height,
  });

  // The element's geometry origin is at the center of the bbox (when offset=0).
  // To align the origin point on the bbox to the anchor point on the tile:
  //   position = anchorPoint - (originPoint - bboxCenter)
  const bboxCenterX = bounds.width / 2;
  const bboxCenterY = bounds.height / 2;

  let localX = anchorPt.x - (originPt.x - bboxCenterX);
  let localY = anchorPt.y - (originPt.y - bboxCenterY);

  // Apply optional offset
  if (rule.offset) {
    localX += rule.offset.x;
    localY += rule.offset.y;
  }

  // Account for bounding box offset (geometry origin != bbox center)
  localX -= bounds.offsetX;
  localY -= bounds.offsetY;

  return { localX, localY };
}
