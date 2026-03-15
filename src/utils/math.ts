import type { Vec2 } from "@/contracts";

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, z: a.z - b.z };
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.z * v.z);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, z: 0 };
  return { x: v.x / len, z: v.z / len };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.z * b.z;
}

export function cross2D(a: Vec2, b: Vec2): number {
  return a.x * b.z - a.z * b.x;
}
