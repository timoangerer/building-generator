import * as THREE from "three";
import type { GeometryPart } from "@/contracts";
import { createRng } from "@/utils";

export function buildPartGeometry(part: GeometryPart): THREE.BufferGeometry {
  switch (part.shape) {
    case "box":
      return new THREE.BoxGeometry(
        part.dimensions.width,
        part.dimensions.height,
        part.dimensions.depth,
      );
    case "cylinder":
      return new THREE.CylinderGeometry(
        part.dimensions.radius,
        part.dimensions.radius,
        part.dimensions.height,
        16,
      );
    case "half_cylinder": {
      const geo = new THREE.CylinderGeometry(
        part.dimensions.radius,
        part.dimensions.radius,
        part.dimensions.depth,
        16,
        1,
        false,
        Math.PI / 2,
        Math.PI,
      );
      geo.rotateX(Math.PI / 2);
      return geo;
    }
  }
}

export function buildingBaseColor(seed: number, buildingIndex: number): THREE.Color {
  const rng = createRng(seed + buildingIndex * 7);
  const hueShift = (rng() * 2 - 1) * (15 / 360);
  const baseHue = 30 / 360;
  return new THREE.Color().setHSL(baseHue + hueShift, 0.5, 0.65);
}
