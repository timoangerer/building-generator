/**
 * Cannon Clash Water Clone
 *
 * A simplified recreation of the water system from the PlayCanvas game
 * "Cannon Clash" by Elanra Studios, ported to Three.js.
 *
 * Features ported:
 *  - Flow-map-driven animated normals
 *  - Depth-based transparency & shore foam
 *  - Caustics
 *  - Fresnel reflection/refraction
 *  - Specular highlights with blinking
 *  - Vertex wave displacement
 *  - Procedural island terrain
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { waterVertexShader, waterFragmentShader } from "./water-shader";
import {
  createNormalMap,
  createFlowMap,
  createCausticsMap,
} from "./procedural-textures";
import {
  createIsland,
  createPalmTree,
  createRock,
} from "./island-geometry";

// ---- Scene setup ----
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0xc8e4f4, 0.004);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.5,
  500,
);
camera.position.set(25, 18, 35);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 10;
controls.maxDistance = 100;
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ---- Depth render target (for shore/caustic effects) ----
const depthRenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
);
depthRenderTarget.depthTexture = new THREE.DepthTexture(
  window.innerWidth,
  window.innerHeight,
);
depthRenderTarget.depthTexture.format = THREE.DepthFormat;
depthRenderTarget.depthTexture.type = THREE.UnsignedIntType;

// ---- Lighting ----
const sunDirection = new THREE.Vector3(0.5, 0.8, 0.3).normalize();

const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
sunLight.position.copy(sunDirection.clone().multiplyScalar(50));
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 100;
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x8ec8f0, 0.6);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3a6b35, 0.4);
scene.add(hemiLight);

// ---- Skybox (simple gradient via shader) ----
const skyGeo = new THREE.SphereGeometry(200, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    uTopColor: { value: new THREE.Color(0x4a90d9) },
    uBottomColor: { value: new THREE.Color(0xb0d4e8) },
    uSunColor: { value: new THREE.Color(0xfff4e0) },
    uSunDir: { value: sunDirection },
  },
  vertexShader: `
    varying vec3 vWorldPos;
    void main() {
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform vec3 uSunColor;
    uniform vec3 uSunDir;
    varying vec3 vWorldPos;
    void main() {
      vec3 dir = normalize(vWorldPos);
      float t = dir.y * 0.5 + 0.5;
      vec3 sky = mix(uBottomColor, uTopColor, pow(t, 0.6));

      // Sun glow
      float sunDot = max(dot(dir, uSunDir), 0.0);
      sky += uSunColor * pow(sunDot, 32.0) * 0.5;
      sky += uSunColor * pow(sunDot, 8.0) * 0.15;

      // Clouds hint
      float clouds = smoothstep(0.4, 0.7, t) *
        (sin(dir.x * 5.0 + dir.z * 3.0) * 0.5 + 0.5) *
        (cos(dir.x * 3.0 - dir.z * 7.0) * 0.5 + 0.5) * 0.3;
      sky += vec3(clouds);

      gl_FragColor = vec4(sky, 1.0);
    }
  `,
  depthWrite: false,
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// ---- Environment cube map for water reflections ----
const cubeRT = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 300, cubeRT);
scene.add(cubeCamera);

// ---- Procedural textures ----
const normalMap = createNormalMap(512);
const flowMap = createFlowMap(256);
const causticsMap = createCausticsMap(512);

// ---- Water ----
// Values from the actual Cannon Clash Ocean entity
const waterUniforms = {
  uTime: { value: 0 },
  uWaterScale: { value: 25 },
  // Cannon Clash water color: teal rgb(0.063, 0.569, 0.463)
  uWaterColor: { value: new THREE.Color(0.05, 0.8, 0.75) }, // bright cyan shallow
  uWaterDeepColor: { value: new THREE.Color(0.01, 0.25, 0.45) }, // deeper blue
  uDepthOpacity: { value: 1.0 },
  uCausticsMap: { value: causticsMap },
  uCausticsOpacity: { value: 0.55 },
  uCausticsIntensity: { value: 5 },
  uCausticsTiling: { value: 10 },
  uShoreOpacity: { value: 1.0 },
  uShoreIntensity: { value: 5 },
  uShoreTiling: { value: 25 },
  uShoreFrequency: { value: 0.05 },
  uFlowMap: { value: flowMap },
  uFlowFrequency: { value: 0.2 },
  uNormalMap: { value: normalMap },
  uBumpiness: { value: 0.06 },
  uReflectionsIntensity: { value: 1.5 },
  uSpecularColor: { value: new THREE.Color(1, 1, 1) },
  uSpecularIntensity: { value: 1000 },
  uSpecularBlinking: { value: 0.3 },
  uEnvMap: { value: cubeRT.texture },
  uSunDirection: { value: sunDirection },
  uSunColor: { value: new THREE.Color(0xfff4e0) },
  uDepthTexture: { value: depthRenderTarget.depthTexture },
  uResolution: {
    value: new THREE.Vector2(window.innerWidth, window.innerHeight),
  },
  uCameraNear: { value: camera.near },
  uCameraFar: { value: camera.far },
  uWavesFrequency: { value: 0.3 },
  uWavesAmplitude: { value: 1.5 },
  uWavesDepthMinMax: { value: new THREE.Vector2(0, 0.08) },
};

const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: waterUniforms,
  transparent: true,
  depthWrite: true,
  side: THREE.DoubleSide,
});

// Large water plane (170x170 like the game, with subdivisions for vertex waves)
const waterGeo = new THREE.PlaneGeometry(170, 170, 128, 128);
waterGeo.rotateX(-Math.PI / 2);
const water = new THREE.Mesh(waterGeo, waterMaterial);
water.position.y = 0;
water.renderOrder = 10; // Render after opaque objects
scene.add(water);

// ---- Islands ----
const islandGroup = new THREE.Group();

// Main center island
const mainIsland = createIsland(15, 10, 42);
mainIsland.position.set(0, -1.5, 0);
islandGroup.add(mainIsland);

// Add palm trees to main island
const palmPositions = [
  new THREE.Vector3(3, 7.2, -2),
  new THREE.Vector3(-4, 7.0, 1),
  new THREE.Vector3(1, 7.5, 4),
  new THREE.Vector3(-2, 6.5, -5),
  new THREE.Vector3(6, 5.8, 2),
];
palmPositions.forEach((pos, i) => {
  islandGroup.add(createPalmTree(pos, i * 17));
});

// Secondary island
const island2 = createIsland(8, 7, 137);
island2.position.set(35, -1.5, -20);
islandGroup.add(island2);

// Add palms to island2
[
  new THREE.Vector3(36, 5.0, -19),
  new THREE.Vector3(33, 4.5, -22),
].forEach((pos, i) => {
  islandGroup.add(createPalmTree(pos, 200 + i * 13));
});

// Small rocky island
const island3 = createIsland(5, 6, 271);
island3.position.set(-30, -1.5, 15);
islandGroup.add(island3);

// Scattered rocks
const rockPositions = [
  { pos: new THREE.Vector3(20, -0.3, 10), scale: 1.5, seed: 1 },
  { pos: new THREE.Vector3(-15, -0.2, -25), scale: 2.0, seed: 2 },
  { pos: new THREE.Vector3(10, -0.1, -30), scale: 1.0, seed: 3 },
  { pos: new THREE.Vector3(-25, -0.4, -10), scale: 1.8, seed: 4 },
  { pos: new THREE.Vector3(40, -0.3, 15), scale: 1.3, seed: 5 },
  { pos: new THREE.Vector3(-10, 0.3, 8), scale: 0.8, seed: 6 },
  { pos: new THREE.Vector3(18, 0.5, -5), scale: 0.6, seed: 7 },
];
rockPositions.forEach(({ pos, scale, seed }) => {
  const rock = createRock(scale, seed);
  rock.position.copy(pos);
  rock.rotation.set(seed * 0.5, seed * 1.2, seed * 0.3);
  islandGroup.add(rock);
});

scene.add(islandGroup);

// ---- Resize handling ----
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);

  depthRenderTarget.setSize(w, h);
  waterUniforms.uResolution.value.set(w, h);
}
window.addEventListener("resize", onResize);

// ---- Render loop ----
const clock = new THREE.Clock();
let envMapNeedsUpdate = true;

function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  // Update env map once (and periodically for moving objects)
  if (envMapNeedsUpdate) {
    water.visible = false;
    cubeCamera.position.set(0, 2, 0);
    cubeCamera.update(renderer, scene);
    water.visible = true;
    waterUniforms.uEnvMap.value = cubeRT.texture;
    envMapNeedsUpdate = false;
  }

  // Update water uniforms
  waterUniforms.uTime.value = elapsed;
  waterUniforms.uCameraNear.value = camera.near;
  waterUniforms.uCameraFar.value = camera.far;

  // Render depth pass (scene without water)
  water.visible = false;
  renderer.setRenderTarget(depthRenderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  water.visible = true;

  // Main render
  renderer.render(scene, camera);
}

animate();
