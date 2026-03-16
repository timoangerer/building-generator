import * as THREE from "three/webgpu";
import { SkyMesh } from "three/examples/jsm/objects/SkyMesh.js";
import type { EnvLayer, ParamDescriptor } from "../types";

export function createAtmosphericSky(): EnvLayer & {
  getSunPosition(): THREE.Vector3;
  getSkyObject(): THREE.Object3D | null;
} {
  let scene: THREE.Scene | null = null;
  let sky: SkyMesh | null = null;

  let sunElevation = 30;
  let sunAzimuth = 180;
  let turbidity = 10;
  let rayleigh = 2;
  let mieCoefficient = 0.005;
  let mieDirectionalG = 0.8;
  let cloudCoverage = 0.4;
  let cloudDensity = 0.5;
  let cloudElevation = 0.5;

  const sunPosition = new THREE.Vector3();

  const params: ParamDescriptor[] = [
    { key: "sunElevation", label: "Sun Elevation", type: "number", min: 0, max: 90, step: 1, default: 30 },
    { key: "sunAzimuth", label: "Sun Azimuth", type: "number", min: 0, max: 360, step: 1, default: 180 },
    { key: "turbidity", label: "Turbidity", type: "number", min: 1, max: 20, step: 0.5, default: 10 },
    { key: "rayleigh", label: "Rayleigh", type: "number", min: 0, max: 4, step: 0.1, default: 2 },
    { key: "mieCoefficient", label: "Mie Coefficient", type: "number", min: 0, max: 0.1, step: 0.001, default: 0.005 },
    { key: "mieDirectionalG", label: "Mie Directional G", type: "number", min: 0, max: 1, step: 0.01, default: 0.8 },
    { key: "cloudCoverage", label: "Cloud Coverage", type: "number", min: 0, max: 1, step: 0.01, default: 0.4 },
    { key: "cloudDensity", label: "Cloud Density", type: "number", min: 0, max: 1, step: 0.01, default: 0.5 },
    { key: "cloudElevation", label: "Cloud Elevation", type: "number", min: 0, max: 1, step: 0.01, default: 0.5 },
  ];

  function computeSunPosition(): void {
    const phi = THREE.MathUtils.degToRad(90 - sunElevation);
    const theta = THREE.MathUtils.degToRad(sunAzimuth);
    sunPosition.setFromSphericalCoords(1, phi, theta);
  }

  function updateSky(): void {
    if (!sky) return;

    sky.turbidity.value = turbidity;
    sky.rayleigh.value = rayleigh;
    sky.mieCoefficient.value = mieCoefficient;
    sky.mieDirectionalG.value = mieDirectionalG;
    sky.cloudCoverage.value = cloudCoverage;
    sky.cloudDensity.value = cloudDensity;
    sky.cloudElevation.value = cloudElevation;

    computeSunPosition();
    sky.sunPosition.value.copy(sunPosition);
  }

  return {
    name: "atmospheric",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;
      sky = new SkyMesh();
      sky.scale.setScalar(10000);

      updateSky();
      scene.add(sky);
    },

    update(_dt: number, _elapsed: number): void {
      // Static sky
    },

    setParam(key: string, value: number | string): void {
      if (typeof value !== "number") return;

      switch (key) {
        case "sunElevation":
          sunElevation = value;
          break;
        case "sunAzimuth":
          sunAzimuth = value;
          break;
        case "turbidity":
          turbidity = value;
          break;
        case "rayleigh":
          rayleigh = value;
          break;
        case "mieCoefficient":
          mieCoefficient = value;
          break;
        case "mieDirectionalG":
          mieDirectionalG = value;
          break;
        case "cloudCoverage":
          cloudCoverage = value;
          break;
        case "cloudDensity":
          cloudDensity = value;
          break;
        case "cloudElevation":
          cloudElevation = value;
          break;
        default:
          return;
      }

      updateSky();
    },

    getParams(): ParamDescriptor[] {
      return params;
    },

    dispose(): void {
      if (sky && scene) {
        scene.remove(sky);
        sky.geometry.dispose();
        sky.material.dispose();
      }
      sky = null;
      scene = null;
    },

    getSunPosition(): THREE.Vector3 {
      computeSunPosition();
      return sunPosition.clone();
    },

    getSkyObject(): THREE.Object3D | null {
      return sky;
    },
  };
}
