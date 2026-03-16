import * as THREE from "three";
import type { EnvLayer, ParamDescriptor } from "../types";
import { simplex2 } from "./simplex-noise";

const PLANE_SIZE = 300;
const SEGMENTS = 200;

interface SlopeParams {
  plateauRadius: number;
  slopeGradient: number;
  noiseScale: number;
  grassColor: string;
  rockColor: string;
  sandColor: string;
}

const DEFAULTS: SlopeParams = {
  plateauRadius: 30,
  slopeGradient: 0.15,
  noiseScale: 0.03,
  grassColor: "#5a9c4a",
  rockColor: "#7a6b55",
  sandColor: "#d4c4a0",
};

const PARAM_DESCRIPTORS: ParamDescriptor[] = [
  { key: "plateauRadius", label: "Plateau Radius", type: "number", min: 5, max: 80, step: 1, default: DEFAULTS.plateauRadius },
  { key: "slopeGradient", label: "Slope Gradient", type: "number", min: 0.05, max: 0.5, step: 0.01, default: DEFAULTS.slopeGradient },
  { key: "noiseScale", label: "Noise Scale", type: "number", min: 0.01, max: 0.1, step: 0.005, default: DEFAULTS.noiseScale },
  { key: "grassColor", label: "Grass Color", type: "color", default: DEFAULTS.grassColor },
  { key: "rockColor", label: "Rock Color", type: "color", default: DEFAULTS.rockColor },
  { key: "sandColor", label: "Sand Color", type: "color", default: DEFAULTS.sandColor },
];

// Fixed plateau height for the center flat area
const PLATEAU_HEIGHT = 10;

function computeHeight(x: number, z: number, p: SlopeParams): number {
  const dist = Math.sqrt(x * x + z * z);
  const noise = simplex2(x * p.noiseScale, z * p.noiseScale);

  if (dist <= p.plateauRadius) {
    // Flat center with very gentle noise
    return PLATEAU_HEIGHT + noise * 0.3;
  }

  // Smooth slope outward, modulated by noise
  const excess = dist - p.plateauRadius;
  const drop = excess * p.slopeGradient;
  const noiseMod = noise * 2.0;
  return Math.max(0, PLATEAU_HEIGHT - drop + noiseMod);
}

function buildGeometry(p: SlopeParams): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const count = positions.count;
  const colors = new Float32Array(count * 3);

  const grassCol = new THREE.Color(p.grassColor);
  const darkGreen = new THREE.Color(p.grassColor).multiplyScalar(0.7);
  const rockCol = new THREE.Color(p.rockColor);
  const sandCol = new THREE.Color(p.sandColor);

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const h = computeHeight(x, z, p);
    // Push flat (height 0) vertices deep below water so they're hidden
    positions.setY(i, h < 0.01 ? -20 : h);

    // Height-based coloring: grass -> darker green -> rock -> sand
    const ratio = h / PLATEAU_HEIGHT;
    let color: THREE.Color;
    if (ratio > 0.8) {
      color = grassCol;
    } else if (ratio > 0.5) {
      const t = (ratio - 0.5) / 0.3;
      color = new THREE.Color().lerpColors(darkGreen, grassCol, t);
    } else if (ratio > 0.2) {
      const t = (ratio - 0.2) / 0.3;
      color = new THREE.Color().lerpColors(rockCol, darkGreen, t);
    } else {
      const t = ratio / 0.2;
      color = new THREE.Color().lerpColors(sandCol, rockCol, t);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createSmoothSlope(): EnvLayer {
  const params: SlopeParams = { ...DEFAULTS };
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
    name: "smooth-slope",

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
