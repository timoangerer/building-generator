import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ThreeContext = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  controls: OrbitControls;
  container: HTMLElement;
  animId: number;
  onResize: () => void;
  meshes: THREE.Object3D[];
};

export function createThreeContext(
  container: HTMLElement,
  opts?: { orthographic?: boolean },
): ThreeContext {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd0d0d0);

  const aspect = container.clientWidth / container.clientHeight;
  let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

  if (opts?.orthographic) {
    const frustumSize = 40;
    camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2, frustumSize * aspect / 2,
      frustumSize / 2, -frustumSize / 2,
      0.1, 500,
    );
    camera.position.set(0, 50, 0);
    camera.lookAt(0, 0, 0);
  } else {
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(20, 30, 10);
  scene.add(dirLight);
  scene.add(new THREE.AmbientLight(0x808080, 0.8));

  let animId = 0;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    ctx.animId = animId;
  }

  const onResize = () => {
    const newAspect = container.clientWidth / container.clientHeight;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = newAspect;
    } else {
      const frustumSize = 40;
      camera.left = -frustumSize * newAspect / 2;
      camera.right = frustumSize * newAspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", onResize);

  const ctx: ThreeContext = {
    renderer,
    scene,
    camera,
    controls,
    container,
    animId: 0,
    onResize,
    meshes: [],
  };

  animate();
  return ctx;
}

export function clearMeshes(ctx: ThreeContext) {
  for (const m of ctx.meshes) {
    ctx.scene.remove(m);
    m.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        const mat = child.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
  ctx.meshes = [];
}

export function disposeContext(ctx: ThreeContext) {
  cancelAnimationFrame(ctx.animId);
  window.removeEventListener("resize", ctx.onResize);
  clearMeshes(ctx);
  ctx.controls.dispose();
  ctx.renderer.dispose();
  ctx.renderer.forceContextLoss();
  if (ctx.renderer.domElement.parentNode === ctx.container) {
    ctx.container.removeChild(ctx.renderer.domElement);
  }
}
