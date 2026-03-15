import type { Vec3, WallSegment } from "@/contracts";

export function wallLocalToWorld(
  wall: WallSegment,
  u: number,
  v: number
): Vec3 {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;

  return {
    x: wall.start.x + dx * u,
    y: v * wall.height,
    z: wall.start.z + dz * u,
  };
}
