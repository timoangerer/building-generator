import * as THREE from "three";
import type { EnvLayer, ParamDescriptor } from "../types";
import { simplex2 } from "./simplex-noise";

const PLANE_SIZE = 300;
const SEGMENTS = 200;

interface StrataParams {
  layerCount: number;
  layerHeight: number;
  noiseScale: number;
  topColor: string;
  midColor: string;
  baseColor: string;
}

const DEFAULTS: StrataParams = {
  layerCount: 3,
  layerHeight: 3,
  noiseScale: 0.04,
  topColor: "#4a8c3f",
  midColor: "#8b7355",
  baseColor: "#c2b280",
};

const PARAM_DESCRIPTORS: ParamDescriptor[] = [
  { key: "layerCount", label: "Layer Count", type: "number", min: 2, max: 5, step: 1, default: DEFAULTS.layerCount },
  { key: "layerHeight", label: "Layer Height", type: "number", min: 1, max: 8, step: 0.5, default: DEFAULTS.layerHeight },
  { key: "noiseScale", label: "Noise Scale", type: "number", min: 0.01, max: 0.1, step: 0.005, default: DEFAULTS.noiseScale },
  { key: "topColor", label: "Top Color", type: "color", default: DEFAULTS.topColor },
  { key: "midColor", label: "Mid Color", type: "color", default: DEFAULTS.midColor },
  { key: "baseColor", label: "Base Color", type: "color", default: DEFAULTS.baseColor },
];

function computeHeight(x: number, z: number, p: StrataParams): number {
  const dist = Math.sqrt(x * x + z * z);
  const noise = simplex2(x * p.noiseScale, z * p.noiseScale);

  // Each layer is a concentric ring. Top layer is innermost.
  const totalHeight = p.layerCount * p.layerHeight;
  const baseRadius = 20; // radius of top disc
  const ringWidth = 25; // width of each step-down ring

  for (let i = 0; i < p.layerCount; i++) {
    const layerRadius = baseRadius + i * ringWidth;
    const noisyRadius = layerRadius + noise * ringWidth * 0.4;

    if (dist < noisyRadius) {
      return totalHeight - i * p.layerHeight;
    }
  }

  // Outside all layers, drop to zero with a short slope
  const outerRadius = baseRadius + (p.layerCount - 1) * ringWidth;
  const noisyOuter = outerRadius + noise * ringWidth * 0.4;
  const fadeWidth = ringWidth * 0.5;

  if (dist < noisyOuter + fadeWidth) {
    const t = (dist - noisyOuter) / fadeWidth;
    return p.layerHeight * (1 - t);
  }

  return 0;
}

function buildGeometry(p: StrataParams): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const count = positions.count;
  const colors = new Float32Array(count * 3);

  const totalHeight = p.layerCount * p.layerHeight;
  const topCol = new THREE.Color(p.topColor);
  const midCol = new THREE.Color(p.midColor);
  const baseCol = new THREE.Color(p.baseColor);

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const h = computeHeight(x, z, p);
    // Push flat (height 0) vertices deep below water so they're hidden
    positions.setY(i, h < 0.01 ? -20 : h);

    // Color by height ratio across strata
    const ratio = totalHeight > 0 ? h / totalHeight : 0;
    let color: THREE.Color;
    if (ratio > 0.66) {
      const t = (ratio - 0.66) / 0.34;
      color = new THREE.Color().lerpColors(midCol, topCol, t);
    } else if (ratio > 0.33) {
      const t = (ratio - 0.33) / 0.33;
      color = new THREE.Color().lerpColors(baseCol, midCol, t);
    } else {
      color = baseCol.clone();
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createLayeredStrata(): EnvLayer {
  const params: StrataParams = { ...DEFAULTS };
  let mesh: THREE.Mesh | null = null;
  let scene: THREE.Scene | null = null;

  function rebuild(): void {
    if (!scene || !mesh) return;
    const oldGeo = mesh.geometry;
    mesh.geometry = buildGeometry(params);
    oldGeo.dispose();
  }

  function getHeightAt(x: number, z: number): number {
    return computeHeight(x, z, params);
  }

  const layer: EnvLayer & { getHeightAt: (x: number, z: number) => number } = {
    name: "layered-strata",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;
      const geometry = buildGeometry(params);
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = 0;
      mesh.receiveShadow = true;
      scene.add(mesh);
    },

    update(_dt: number, _elapsed: number): void {
      // Static terrain – no-op
    },

    setParam(key: string, value: number | string): void {
      if (key in params) {
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
