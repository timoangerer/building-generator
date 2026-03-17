import type { ElementDefinition, GeometryPart } from "@/contracts";

export type ElementBounds = {
  width: number;
  height: number;
  depth: number;
  /** Offset from element origin to bounding box center (element-local coords) */
  offsetX: number;
  offsetY: number;
  offsetZ: number;
};

function partExtent(part: GeometryPart): {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
} {
  const px = part.position.x;
  const py = part.position.y;
  const pz = part.position.z;

  let hw: number, hh: number, hd: number;

  switch (part.shape) {
    case "box":
      hw = part.dimensions.width / 2;
      hh = part.dimensions.height / 2;
      hd = part.dimensions.depth / 2;
      break;
    case "cylinder":
      hw = part.dimensions.radius;
      hh = part.dimensions.height / 2;
      hd = part.dimensions.radius;
      break;
    case "half_cylinder":
      hw = part.dimensions.radius;
      hd = part.dimensions.depth / 2;
      // Semicircle: spans full radius in height (from center upward)
      return {
        minX: px - hw, maxX: px + hw,
        minY: py, maxY: py + part.dimensions.radius,
        minZ: pz - hd, maxZ: pz + hd,
      };
  }

  return {
    minX: px - hw, maxX: px + hw,
    minY: py - hh, maxY: py + hh,
    minZ: pz - hd, maxZ: pz + hd,
  };
}

export function computeElementBounds(element: ElementDefinition): ElementBounds {
  if (element.geometry.type === "box") {
    return {
      width: element.geometry.box.width,
      height: element.geometry.box.height,
      depth: element.geometry.box.depth,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
    };
  }

  const parts = element.geometry.parts;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const part of parts) {
    const ext = partExtent(part);
    minX = Math.min(minX, ext.minX);
    maxX = Math.max(maxX, ext.maxX);
    minY = Math.min(minY, ext.minY);
    maxY = Math.max(maxY, ext.maxY);
    minZ = Math.min(minZ, ext.minZ);
    maxZ = Math.max(maxZ, ext.maxZ);
  }

  return {
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ,
    offsetX: (minX + maxX) / 2,
    offsetY: (minY + maxY) / 2,
    offsetZ: (minZ + maxZ) / 2,
  };
}
