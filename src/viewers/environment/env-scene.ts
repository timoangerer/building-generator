import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import type { EnvLayer, FogConfig } from "./types";
import {
  createLayer,
  type LayerCategory,
} from "./registry";

// Import index files to trigger registration side effects
import "./terrain/index";
import "./sky/index";
import "./water/index";

export interface EnvSceneApi {
  setLayer(category: LayerCategory, id: string): void;
  setLayerParam(category: LayerCategory, key: string, value: number | string): void;
  setFog(config: FogConfig): void;
  getActiveLayer(category: LayerCategory): EnvLayer | null;
  dispose(): void;
}

export async function createEnvScene(container: HTMLElement): Promise<EnvSceneApi> {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  // Note: localClippingEnabled is not available on WebGPURenderer
  // Clipping planes are handled differently in node materials
  await renderer.init();
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.5,
    500,
  );
  camera.position.set(30, 30, 100);
  camera.lookAt(0, 10, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 10;
  controls.maxDistance = 200;
  controls.update();

  // Lighting — strong enough for a bright daytime scene
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(30, 50, 20);
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5a2a, 1.0);
  scene.add(hemiLight);

  // PMREM environment map generation — use a separate scene containing only the sky
  // to avoid terrain/water polluting the env map (matches Three.js ocean example approach)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  let envRenderTarget: THREE.RenderTarget | null = null;

  function updateEnvironment(): void {
    const skyLayer = activeLayers.sky as EnvLayer & { getSkyObject?: () => THREE.Object3D } | null;
    if (!skyLayer) return;

    try {
      if (envRenderTarget) {
        envRenderTarget.dispose();
      }

      // Temporarily move sky mesh into isolated env scene for PMREM capture
      const skyObj = skyLayer.getSkyObject?.();
      if (skyObj) {
        envScene.add(skyObj);
        envRenderTarget = pmremGenerator.fromScene(envScene);
        scene.add(skyObj); // move back to main scene
      } else {
        // Fallback: capture from main scene
        envRenderTarget = pmremGenerator.fromScene(scene);
      }

      scene.environment = envRenderTarget.texture;
    } catch (e) {
      console.warn("PMREM environment map generation failed:", e);
    }
  }

  function syncSunPosition(): void {
    const skyLayer = activeLayers.sky as EnvLayer & { getSunPosition?: () => THREE.Vector3 } | null;
    const waterLayer = activeLayers.water as EnvLayer & { setSunDirection?: (dir: THREE.Vector3) => void } | null;

    if (skyLayer && typeof skyLayer.getSunPosition === "function") {
      const sunPos = skyLayer.getSunPosition();

      // Update water sun direction
      if (waterLayer && typeof waterLayer.setSunDirection === "function") {
        waterLayer.setSunDirection(sunPos);
      }

      // Update directional light to match sun
      dirLight.position.copy(sunPos).multiplyScalar(100);
    }
  }

  // Active layers
  const activeLayers: Record<LayerCategory, EnvLayer | null> = {
    water: null,
    sky: null,
    terrain: null,
  };

  function setLayer(category: LayerCategory, id: string): void {
    const old = activeLayers[category];
    if (old) {
      old.dispose();
    }

    const layer = createLayer(category, id);
    if (layer) {
      layer.create(scene, camera);
      activeLayers[category] = layer;
    } else {
      activeLayers[category] = null;
    }

    // After creating sky or water, synchronize sun and regenerate env map
    if (category === "sky" || category === "water") {
      syncSunPosition();
      updateEnvironment();
    }
  }

  function setLayerParam(
    category: LayerCategory,
    key: string,
    value: number | string,
  ): void {
    const layer = activeLayers[category];
    if (layer) {
      layer.setParam(key, value);
    }

    // After sky param changes, sync sun and regenerate env map
    if (category === "sky") {
      syncSunPosition();
      updateEnvironment();
    }
  }

  function setFog(config: FogConfig): void {
    if (!config.enabled) {
      scene.fog = null;
      return;
    }
    const color = new THREE.Color(config.color);
    if (config.type === "linear") {
      scene.fog = new THREE.Fog(color, config.near ?? 50, config.far ?? 200);
    } else {
      scene.fog = new THREE.FogExp2(color, config.density ?? 0.01);
    }
  }

  function getActiveLayer(category: LayerCategory): EnvLayer | null {
    return activeLayers[category];
  }

  // FPS stats display
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Render loop using setAnimationLoop (required for WebGPU)
  let lastTime = performance.now();
  let elapsed = 0;

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += dt;

    controls.update();

    for (const layer of Object.values(activeLayers)) {
      if (layer) {
        layer.update(dt, elapsed);
      }
    }

    renderer.render(scene, camera);
    stats.update();
  });

  // Resize handler
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", onResize);

  function dispose() {
    renderer.setAnimationLoop(null);
    window.removeEventListener("resize", onResize);
    for (const category of Object.keys(activeLayers) as LayerCategory[]) {
      const layer = activeLayers[category];
      if (layer) {
        layer.dispose();
        activeLayers[category] = null;
      }
    }
    envRenderTarget?.dispose();
    pmremGenerator.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
    container.removeChild(stats.dom);
  }

  return { setLayer, setLayerParam, setFog, getActiveLayer, dispose };
}
