import * as THREE from "three/webgpu";
import {
  color,
  vec2,
  linearDepth,
  viewportLinearDepth,
  viewportDepthTexture,
  viewportSharedTexture,
  mx_worley_noise_float,
  positionWorld,
  screenUV,
  time,
} from "three/tsl";
import type { EnvLayer, ParamDescriptor } from "../types";

/**
 * Backdrop water with see-through refraction using TSL (Three Shading Language).
 * Based on the Three.js webgpu_backdrop_water example, adapted for large scenes.
 * Requires WebGPURenderer.
 */

export function createBackdropWater(): EnvLayer {
  let scene: THREE.Scene | null = null;
  let waterMesh: THREE.Mesh | null = null;
  let ballGroup: THREE.Group | null = null;
  let floorCylinder: THREE.Mesh | null = null;

  let deepColor = "#0487e2";
  let shallowColor = "#74ccf4";
  let speed = 0.8;
  let ballCount = 30;

  const params: ParamDescriptor[] = [
    { key: "deepColor", label: "Deep Color", type: "color", default: "#0487e2" },
    { key: "shallowColor", label: "Shallow Color", type: "color", default: "#74ccf4" },
    { key: "speed", label: "Speed", type: "number", min: 0.1, max: 3, step: 0.1, default: 0.8 },
    { key: "ballCount", label: "Ball Count", type: "number", min: 5, max: 100, step: 5, default: 30 },
  ];

  function buildWater(): THREE.Mesh {
    const t = time.mul(speed);
    // Scale UVs down for our large scene (~300 unit terrain).
    // Original example uses mul(4)/mul(2) for a ~30-unit scene.
    // We divide by ~10x to compensate: 0.4 and 0.2.
    const floorUV = positionWorld.xzy;

    const waterLayer0 = mx_worley_noise_float(floorUV.mul(0.4).add(t));
    const waterLayer1 = mx_worley_noise_float(floorUV.mul(0.2).add(t));

    const waterIntensity = waterLayer0.mul(waterLayer1);
    const waterColor = waterIntensity.mul(1.4).mix(
      color(new THREE.Color(deepColor)),
      color(new THREE.Color(shallowColor)),
    );

    // Depth calculations for see-through effect.
    // linearDepth is normalized to [0,1] based on camera near/far.
    // With far=500 (set in env-scene), depth values are usable.
    const depth = linearDepth();
    const depthWater = viewportLinearDepth.sub(depth);
    const depthEffect = depthWater.remapClamp(-0.002, 0.04);

    // Refraction UV offset based on water noise
    const refractionUV = screenUV.add(vec2(0, waterIntensity.mul(0.1)));

    // Depth test at refracted position to prevent artifacts at edges
    const depthTestForRefraction = linearDepth(viewportDepthTexture(refractionUV)).sub(depth);
    const depthRefraction = depthTestForRefraction.remapClamp(0, 0.1);

    // Use original UV when refraction would sample above water surface
    const finalUV = depthTestForRefraction.lessThan(0).select(screenUV, refractionUV);
    const viewportTexture = viewportSharedTexture(finalUV);

    // Create see-through water material
    const waterMaterial = new THREE.MeshBasicNodeMaterial();
    waterMaterial.colorNode = waterColor;
    waterMaterial.backdropNode = depthEffect.mix(
      viewportSharedTexture(),
      viewportTexture.mul(depthRefraction.mix(1, waterColor)),
    );
    waterMaterial.backdropAlphaNode = depthRefraction.oneMinus();
    waterMaterial.transparent = true;

    const geometry = new THREE.BoxGeometry(10000, 0.001, 10000);
    const mesh = new THREE.Mesh(geometry, waterMaterial);
    mesh.position.set(0, 0, 0);

    return mesh;
  }

  function buildBalls(count: number): THREE.Group {
    // Balls sized for our large scene (terrain ~300 units)
    const geometry = new THREE.IcosahedronGeometry(3, 3);
    const material = new THREE.MeshStandardNodeMaterial({
      color: new THREE.Color(0x4488aa),
      roughness: 0.3,
      metalness: 0.1,
    });

    const group = new THREE.Group();

    // Place balls in a ring around the island shore.
    // Terrain island has ~70 unit radius (plateauRadius 30 + falloffWidth 40).
    // Place balls just outside the shore at radius ~80-120.
    const minRadius = 80;
    const maxRadius = 120;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      group.add(mesh);
    }

    return group;
  }

  function buildFloor(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(15, 15, 40);
    const material = new THREE.MeshStandardNodeMaterial({
      color: new THREE.Color(0x4488aa),
      roughness: 0.4,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -20, 0);
    return mesh;
  }

  return {
    name: "backdrop-water",

    create(s: THREE.Scene, _camera: THREE.Camera): void {
      scene = s;

      waterMesh = buildWater();
      scene.add(waterMesh);

      ballGroup = buildBalls(ballCount);
      scene.add(ballGroup);

      floorCylinder = buildFloor();
      scene.add(floorCylinder);
    },

    update(dt: number, elapsed: number): void {
      if (!ballGroup) return;

      for (const child of ballGroup.children) {
        const mesh = child as THREE.Mesh;
        // Bobbing up and down through the water surface
        mesh.position.y = Math.sin(elapsed * speed + mesh.id) * 5;
        mesh.rotation.y += dt * 0.3;
      }
    },

    setParam(key: string, value: number | string): void {
      if (key === "deepColor" && typeof value === "string") {
        deepColor = value;
        rebuildWater();
      } else if (key === "shallowColor" && typeof value === "string") {
        shallowColor = value;
        rebuildWater();
      } else if (key === "speed" && typeof value === "number") {
        speed = value;
      } else if (key === "ballCount" && typeof value === "number") {
        ballCount = Math.round(value);
        rebuildBalls();
      }
    },

    getParams(): ParamDescriptor[] {
      return params;
    },

    dispose(): void {
      if (scene) {
        if (waterMesh) {
          scene.remove(waterMesh);
          waterMesh.geometry.dispose();
          (waterMesh.material as THREE.Material).dispose();
          waterMesh = null;
        }
        if (ballGroup) {
          scene.remove(ballGroup);
          for (const child of ballGroup.children) {
            const mesh = child as THREE.Mesh;
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
          }
          ballGroup = null;
        }
        if (floorCylinder) {
          scene.remove(floorCylinder);
          floorCylinder.geometry.dispose();
          (floorCylinder.material as THREE.Material).dispose();
          floorCylinder = null;
        }
      }
      scene = null;
    },
  };

  function rebuildWater(): void {
    if (!scene || !waterMesh) return;
    scene.remove(waterMesh);
    waterMesh.geometry.dispose();
    (waterMesh.material as THREE.Material).dispose();

    waterMesh = buildWater();
    scene.add(waterMesh);
  }

  function rebuildBalls(): void {
    if (!scene || !ballGroup) return;
    scene.remove(ballGroup);
    for (const child of ballGroup.children) {
      const mesh = child as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    ballGroup = buildBalls(ballCount);
    scene.add(ballGroup);
  }
}
