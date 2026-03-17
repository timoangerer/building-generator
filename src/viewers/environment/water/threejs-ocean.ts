import * as THREE from "three/webgpu";
import { WaterMesh } from "three/examples/jsm/objects/WaterMesh.js";
import type { EnvLayer, ParamDescriptor } from "../types";

/**
 * Generate a procedural normal-map DataTexture as fallback
 * when waternormals.jpg is unavailable.
 */
function createNormalTexture(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const fx = x / size;
      const fy = y / size;
      const nx = Math.sin(fx * Math.PI * 8) * Math.sin(fy * Math.PI * 6) * 0.15;
      const ny = Math.sin(fx * Math.PI * 6) * Math.sin(fy * Math.PI * 8) * 0.15;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createThreejsOcean(): EnvLayer & {
  setSunDirection(dir: THREE.Vector3): void;
} {
  let scene: THREE.Scene | null = null;
  let water: WaterMesh | null = null;
  let geometry: THREE.PlaneGeometry | null = null;
  let normalTexture: THREE.Texture | null = null;

  let waterColor = "#001e0f";
  let distortionScale = 3.7;

  const params: ParamDescriptor[] = [
    { key: "waterColor", label: "Water Color", type: "color", default: "#001e0f" },
    { key: "distortionScale", label: "Distortion Scale", type: "number", min: 0, max: 8, step: 0.1, default: 3.7 },
  ];

  return {
    name: "threejs-ocean",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;
      geometry = new THREE.PlaneGeometry(10000, 10000);

      // Use procedural texture immediately, attempt to load real texture
      normalTexture = createNormalTexture();

      const loader = new THREE.TextureLoader();
      loader.load(
        "https://threejs.org/examples/textures/waternormals.jpg",
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          // WaterMesh uses a texture node internally — updating requires rebuild
          if (water && scene) {
            const oldWater = water;
            scene.remove(oldWater);
            oldWater.material.dispose();

            normalTexture?.dispose();
            normalTexture = tex;

            water = new WaterMesh(geometry!, {
              waterNormals: tex,
              sunDirection: new THREE.Vector3(0.7, 0.5, 0.3).normalize(),
              sunColor: 0xffffff,
              waterColor: new THREE.Color(waterColor).getHex(),
              distortionScale,
            });
            water.rotation.x = -Math.PI / 2;
            water.material.polygonOffset = true;
            water.material.polygonOffsetFactor = -1;
            water.material.polygonOffsetUnits = -1;
            scene.add(water);
          }
        },
      );

      const sunDirection = new THREE.Vector3(0.7, 0.5, 0.3).normalize();

      water = new WaterMesh(geometry, {
        waterNormals: normalTexture,
        sunDirection,
        sunColor: 0xffffff,
        waterColor: new THREE.Color(waterColor).getHex(),
        distortionScale,
      });

      water.rotation.x = -Math.PI / 2;

      // Avoid z-fighting with terrain at the same Y level
      water.material.polygonOffset = true;
      water.material.polygonOffsetFactor = -1;
      water.material.polygonOffsetUnits = -1;

      scene.add(water);
    },

    update(_dt: number, _elapsed: number): void {
      // WaterMesh animates via TSL time node — no manual update needed
    },

    setParam(key: string, value: number | string): void {
      if (key === "waterColor" && typeof value === "string") {
        waterColor = value;
        if (water) {
          water.waterColor.value.set(value);
        }
      } else if (key === "distortionScale" && typeof value === "number") {
        distortionScale = value;
        if (water) {
          water.distortionScale.value = value;
        }
      }
    },

    getParams(): ParamDescriptor[] {
      return params;
    },

    dispose(): void {
      if (water && scene) {
        scene.remove(water);
      }
      geometry?.dispose();
      water?.material.dispose();
      normalTexture?.dispose();
      water = null;
      geometry = null;
      normalTexture = null;
      scene = null;
    },

    setSunDirection(dir: THREE.Vector3): void {
      if (water) {
        water.sunDirection.value.copy(dir).normalize();
      }
    },
  };
}
