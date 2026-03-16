import * as THREE from "three";
import type { EnvLayer, ParamDescriptor } from "../types";
import { simplex2 } from "./simplex-noise";

const PLANE_SIZE = 300;
const SEGMENTS = 200;
const SKIRT_DEPTH = -8;
const HEIGHT_THRESHOLD = 0.01;

interface PlateauParams {
  plateauRadius: number;
  falloffWidth: number;
  noiseScale: number;
  noiseStrength: number;
  plateauHeight: number;
  elevation: number;
}

const DEFAULTS: PlateauParams = {
  plateauRadius: 30,
  falloffWidth: 40,
  noiseScale: 0.05,
  noiseStrength: 15,
  plateauHeight: 8,
  elevation: -4,
};

const PARAM_DESCRIPTORS: ParamDescriptor[] = [
  { key: "plateauRadius", label: "Plateau Radius", type: "number", min: 5, max: 80, step: 1, default: DEFAULTS.plateauRadius },
  { key: "falloffWidth", label: "Falloff Width", type: "number", min: 5, max: 80, step: 1, default: DEFAULTS.falloffWidth },
  { key: "noiseScale", label: "Noise Scale", type: "number", min: 0.01, max: 0.2, step: 0.005, default: DEFAULTS.noiseScale },
  { key: "noiseStrength", label: "Noise Strength", type: "number", min: 0, max: 30, step: 1, default: DEFAULTS.noiseStrength },
  { key: "plateauHeight", label: "Plateau Height", type: "number", min: 1, max: 30, step: 0.5, default: DEFAULTS.plateauHeight },
  { key: "elevation", label: "Elevation", type: "number", min: -10, max: 10, step: 0.5, default: -4 },
];

function computeHeight(x: number, z: number, p: PlateauParams): number {
  const dist = Math.sqrt(x * x + z * z);
  const noise = simplex2(x * p.noiseScale, z * p.noiseScale) * p.noiseStrength;
  const edgeDist = dist + noise * 0.3;

  if (edgeDist <= p.plateauRadius) {
    return p.plateauHeight;
  }

  const falloffEnd = p.plateauRadius + p.falloffWidth;
  if (edgeDist >= falloffEnd) {
    return 0;
  }

  const t = (edgeDist - p.plateauRadius) / p.falloffWidth;
  // Smooth hermite interpolation
  const s = t * t * (3 - 2 * t);
  return p.plateauHeight * (1 - s);
}

/**
 * Build a trimmed island geometry: only faces where at least one vertex
 * has height > threshold are kept. Non-island vertices in kept faces
 * become a "skirt" wall going down to SKIRT_DEPTH.
 */
function buildGeometry(p: PlateauParams): THREE.BufferGeometry {
  // Start with a full grid
  const base = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS);
  base.rotateX(-Math.PI / 2);

  const positions = base.attributes.position;
  const count = positions.count;

  // Compute heights for all vertices
  const heights = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    heights[i] = computeHeight(positions.getX(i), positions.getZ(i), p);
  }

  // Determine which vertices are "island"
  const isIsland = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    isIsland[i] = heights[i] > HEIGHT_THRESHOLD ? 1 : 0;
  }

  // Filter faces: keep only if ANY vertex is island
  const oldIndex = base.index!;
  const keptIndices: number[] = [];
  const usedVertices = new Set<number>();

  for (let f = 0; f < oldIndex.count; f += 3) {
    const a = oldIndex.getX(f);
    const b = oldIndex.getX(f + 1);
    const c = oldIndex.getX(f + 2);

    if (isIsland[a] || isIsland[b] || isIsland[c]) {
      keptIndices.push(a, b, c);
      usedVertices.add(a);
      usedVertices.add(b);
      usedVertices.add(c);
    }
  }

  // Set vertex heights: island vertices keep height, skirt vertices go down
  for (let i = 0; i < count; i++) {
    if (isIsland[i]) {
      positions.setY(i, heights[i]);
    } else if (usedVertices.has(i)) {
      // Skirt vertex: part of a kept face but not island
      positions.setY(i, SKIRT_DEPTH);
    }
    // Unused vertices don't matter
  }

  // Vertex colors based on original height
  const colors = new Float32Array(count * 3);
  const green = new THREE.Color(0x4a8c3f);
  const brown = new THREE.Color(0x7a6040);
  const sand = new THREE.Color(0xd4c4a0);

  for (let i = 0; i < count; i++) {
    const h = heights[i];
    const ratio = h / p.plateauHeight;
    let c: THREE.Color;
    if (ratio > 0.8) {
      c = green;
    } else if (ratio > 0.2) {
      const t = (ratio - 0.2) / 0.6;
      c = new THREE.Color().lerpColors(sand, brown, t);
    } else {
      c = sand;
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  // Build the trimmed geometry
  base.setIndex(keptIndices);
  base.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  base.computeVertexNormals();

  return base;
}

export function createPlateauNoise(): EnvLayer {
  const params: PlateauParams = { ...DEFAULTS };
  let mesh: THREE.Mesh | null = null;
  let scene: THREE.Scene | null = null;

  function rebuild(): void {
    if (!scene || !mesh) return;
    const oldGeo = mesh.geometry;
    mesh.geometry = buildGeometry(params);
    mesh.position.y = params.elevation;
    oldGeo.dispose();
  }

  function getHeightAt(x: number, z: number): number {
    return computeHeight(x, z, params);
  }

  const layer: EnvLayer & { getHeightAt: (x: number, z: number) => number } = {
    name: "plateau-noise",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;
      const geometry = buildGeometry(params);
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide,
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = params.elevation;
      mesh.receiveShadow = true;
      scene.add(mesh);
    },

    update(_dt: number, _elapsed: number): void {
      // Static terrain – no-op
    },

    setParam(key: string, value: number | string): void {
      if (key === "elevation" && typeof value === "number") {
        params.elevation = value;
        if (mesh) {
          mesh.position.y = value;
        }
      } else if (key in params) {
        (params as unknown as Record<string, number | string>)[key] = value;
        rebuild();
      }
    },

    getParams(): ParamDescriptor[] {
      return PARAM_DESCRIPTORS;
    },

    dispose(): void {
      if (mesh && scene) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        mesh = null;
      }
      scene = null;
    },

    getHeightAt,
  };

  return layer;
}
