import type { Vec2, AABB2 } from "@/contracts";

export function withinBounds(point: Vec2, bounds: AABB2): boolean {
  return (
    point.x >= bounds.min.x &&
    point.x <= bounds.max.x &&
    point.z >= bounds.min.z &&
    point.z <= bounds.max.z
  );
}

type Rect = { x: number; z: number; width: number; depth: number };

export function noOverlaps(rects: Rect[]): boolean {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapZ = a.z < b.z + b.depth && a.z + a.depth > b.z;
      if (overlapX && overlapZ) return false;
    }
  }
  return true;
}

export function isFiniteCoord(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.every(isFiniteCoord);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isFiniteCoord);
  }
  return true;
}
