import * as THREE from "three/webgpu";
import { color, normalWorld } from "three/tsl";
import type { EnvLayer, ParamDescriptor } from "../types";

/**
 * Simple gradient sky using TSL nodes — compatible with WebGPURenderer.
 * Based on the sky setup from the Three.js webgpu_backdrop_water example.
 */

export function createGradientSky(): EnvLayer & {
  getSunPosition(): THREE.Vector3;
} {
  let scene: THREE.Scene | null = null;

  let horizonColor = "#e8e0d4";
  let zenithColor = "#87b8de";
  let sunElevation = 30;
  let sunAzimuth = 180;

  const sunPosition = new THREE.Vector3();

  const params: ParamDescriptor[] = [
    { key: "horizonColor", label: "Horizon Color", type: "color", default: "#e8e0d4" },
    { key: "zenithColor", label: "Zenith Color", type: "color", default: "#87b8de" },
    { key: "sunElevation", label: "Sun Elevation", type: "number", min: 0, max: 90, step: 1, default: 30 },
    { key: "sunAzimuth", label: "Sun Azimuth", type: "number", min: 0, max: 360, step: 1, default: 180 },
  ];

  function computeSunPosition(): void {
    const phi = THREE.MathUtils.degToRad(90 - sunElevation);
    const theta = THREE.MathUtils.degToRad(sunAzimuth);
    sunPosition.setFromSphericalCoords(1, phi, theta);
  }

  function updateBackground(): void {
    if (!scene) return;
    // Gradient from horizon to zenith based on world normal Y
    (scene as any).backgroundNode = normalWorld.y.mix(
      color(new THREE.Color(horizonColor)),
      color(new THREE.Color(zenithColor)),
    );
  }

  return {
    name: "gradient-sky",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;
      computeSunPosition();
      updateBackground();
    },

    update(_dt: number, _elapsed: number): void {
      // Static sky
    },

    setParam(key: string, value: number | string): void {
      switch (key) {
        case "horizonColor":
          if (typeof value === "string") {
            horizonColor = value;
            updateBackground();
          }
          break;
        case "zenithColor":
          if (typeof value === "string") {
            zenithColor = value;
            updateBackground();
          }
          break;
        case "sunElevation":
          if (typeof value === "number") {
            sunElevation = value;
            computeSunPosition();
          }
          break;
        case "sunAzimuth":
          if (typeof value === "number") {
            sunAzimuth = value;
            computeSunPosition();
          }
          break;
      }
    },

    getParams(): ParamDescriptor[] {
      return params;
    },

    dispose(): void {
      if (scene) {
        (scene as any).backgroundNode = null;
        scene.background = null;
      }
      scene = null;
    },

    getSunPosition(): THREE.Vector3 {
      computeSunPosition();
      return sunPosition.clone();
    },
  };
}
