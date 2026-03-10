import type { FacadeHeaderType, FacadeLayout, FacadeOrnament, LayoutItem } from "@green-buses/facade-core";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface FacadePreviewScene {
  focus: () => void;
  renderLayout: (layout: FacadeLayout) => void;
  resize: () => void;
  destroy: () => void;
}

const materials = {
  accent: new THREE.MeshStandardMaterial({ color: "#f7eee0", roughness: 0.7 }),
  balcony: new THREE.MeshStandardMaterial({ color: "#8a8d92", roughness: 0.52, metalness: 0.28 }),
  dark: new THREE.MeshStandardMaterial({ color: "#5c5349", roughness: 0.92 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#8fb0bf",
    roughness: 0.15,
    metalness: 0.18,
    transparent: true,
    opacity: 0.9,
  }),
  mass: new THREE.MeshStandardMaterial({ color: "#d9cdbb", roughness: 0.93, metalness: 0.03 }),
  trim: new THREE.MeshStandardMaterial({ color: "#c5b097", roughness: 0.72 }),
};

function makeBox(width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addHeader(group: THREE.Group, type: FacadeHeaderType | undefined, width: number, y: number, depth: number): void {
  if (!type) return;

  if (type === "lintel") {
    const lintel = makeBox(width * 1.1, 0.16, 0.12, materials.trim);
    lintel.position.set(0, y, depth);
    group.add(lintel);
    return;
  }

  if (type === "pediment") {
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(width * 0.42, 0.34, 3), materials.trim);
    pediment.rotation.z = Math.PI / 2;
    pediment.position.set(0, y + 0.12, depth);
    pediment.castShadow = true;
    group.add(pediment);
    return;
  }

  const arch = new THREE.Mesh(new THREE.TorusGeometry(width * 0.24, 0.06, 10, 24, Math.PI), materials.trim);
  arch.rotation.z = Math.PI;
  arch.position.set(0, y, depth);
  arch.castShadow = true;
  group.add(arch);
}

function buildFacadeElement(item: LayoutItem): THREE.Group {
  const group = new THREE.Group();
  const width = item.width;
  const height = item.visualHeight;
  const baseDepth = item.frameDepth ?? 0.12;
  const frame = makeBox(width, height, baseDepth, materials.trim);
  frame.position.z = 0.03;

  if (item.type === "window" || item.type === "glass") {
    const pane = makeBox(width * 0.76, height * 0.78, 0.06, materials.glass);
    group.add(frame, pane);
    if (item.sill) {
      const sill = makeBox(width * 0.84, 0.12, 0.18, materials.trim);
      sill.position.set(0, -height * 0.44, 0.08);
      group.add(sill);
    }
    addHeader(group, item.header, width, height * 0.54, 0.05);
  } else if (item.type === "door" || item.type === "entry") {
    const doorLeaf = makeBox(width * 0.72, height * 0.88, 0.08, materials.dark);
    doorLeaf.position.z = 0.02;
    group.add(frame, doorLeaf);
    if (item.arch) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(width * 0.26, 0.08, 12, 28, Math.PI), materials.trim);
      arch.rotation.z = Math.PI;
      arch.position.set(0, height * 0.5, 0.08);
      arch.castShadow = true;
      group.add(arch);
    }
  } else if (item.type === "oculus") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(width * 0.25, 0.08, 14, 26), materials.trim);
    const pane = new THREE.Mesh(new THREE.CircleGeometry(width * 0.2, 28), materials.glass);
    pane.position.z = 0.04;
    ring.castShadow = true;
    group.add(ring, pane);
  } else if (item.type === "screen") {
    const panel = makeBox(width * 0.9, height * 0.72, 0.1, materials.trim);
    const slat = makeBox(0.08, height * 0.72, 0.14, materials.dark);
    for (let index = -2; index <= 2; index += 1) {
      const clone = slat.clone();
      clone.position.x = index * (width * 0.16);
      group.add(clone);
    }
    group.add(panel);
  }

  if (item.hasBalcony && item.balcony) {
    const slab = makeBox(width * 0.92, 0.16, item.balcony.depth, materials.balcony);
    slab.position.set(0, -height * 0.62, item.balcony.depth / 2 - 0.02);
    group.add(slab);

    const rail = makeBox(width * 0.9, item.balcony.railHeight, 0.06, materials.dark);
    rail.position.set(0, -height * 0.18, item.balcony.depth - 0.04);
    group.add(rail);

    const sideRail = makeBox(0.05, item.balcony.railHeight, item.balcony.depth, materials.dark);
    const left = sideRail.clone();
    const right = sideRail.clone();
    left.position.set(-width * 0.45, -height * 0.18, item.balcony.depth / 2);
    right.position.set(width * 0.45, -height * 0.18, item.balcony.depth / 2);
    group.add(left, right);
  }

  return group;
}

function buildOrnament(ornament: FacadeOrnament, wallWidth: number): THREE.Object3D | null {
  if (ornament.type === "cornice") {
    const cornice = makeBox(wallWidth, ornament.size, 0.28, materials.trim);
    cornice.position.set(0, ornament.offsetY, 0.08);
    return cornice;
  }

  if (ornament.type === "band") {
    const band = makeBox(wallWidth, ornament.size, 0.14, materials.trim);
    band.position.set(0, ornament.offsetY, 0.04);
    return band;
  }

  return null;
}

function disposeObject(node: THREE.Object3D): void {
  node.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
  });
}

function clearGroup(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    if (!child) {
      break;
    }
    group.remove(child);
    disposeObject(child);
  }
}

export function createFacadePreviewScene(container: HTMLElement): FacadePreviewScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ece0cf");
  scene.fog = new THREE.Fog("#ece0cf", 30, 80);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight("#fff6e9", "#947f66", 1.6));
  const sun = new THREE.DirectionalLight("#fff8ed", 1.75);
  sun.position.set(14, 20, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(36, 64),
    new THREE.MeshStandardMaterial({ color: "#ccb89c", roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(40, 20, "#a8845f", "#bda98e");
  grid.position.y = 0.02;
  scene.add(grid);

  const stage = new THREE.Group();
  scene.add(stage);

  let currentLayout: FacadeLayout | null = null;

  const focusOnLayout = (layout: FacadeLayout): void => {
    const distance = Math.max(layout.wall.width * 0.72, layout.wall.height * 0.85, layout.wall.previewDepth * 6) + 4;
    camera.position.set(layout.wall.width * 0.18, layout.wall.height * 0.6, distance);
    controls.target.set(0, layout.wall.height * 0.52, -layout.wall.previewDepth * 0.25);
    controls.update();
  };

  const rebuild = (layout: FacadeLayout): void => {
    currentLayout = layout;
    clearGroup(stage);

    const wall = makeBox(layout.wall.width, layout.wall.height, layout.wall.previewDepth, materials.mass);
    wall.position.set(0, layout.wall.height / 2, -layout.wall.previewDepth / 2);
    stage.add(wall);

    const facadePlane = makeBox(layout.wall.width, layout.wall.height, 0.2, materials.accent);
    facadePlane.position.set(0, layout.wall.height / 2, 0.02);
    stage.add(facadePlane);

    for (const zone of layout.zones) {
      for (const row of zone.rows) {
        for (const item of row.items) {
          const element = buildFacadeElement(item);
          element.position.set(item.x, item.centerY, 0.16);
          stage.add(element);
        }
      }

      for (const ornament of zone.ornaments) {
        const node = buildOrnament(ornament, layout.wall.width);
        if (node) {
          stage.add(node);
        }
      }
    }

    const roof = makeBox(layout.wall.width, 0.24, layout.wall.previewDepth, materials.trim);
    roof.position.set(0, layout.wall.height + 0.12, -layout.wall.previewDepth / 2);
    stage.add(roof);

    focusOnLayout(layout);
  };

  const resize = (): void => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  const renderFrame = (): void => {
    controls.update();
    renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(container);
  resize();
  renderer.setAnimationLoop(renderFrame);

  return {
    focus(): void {
      if (currentLayout) {
        focusOnLayout(currentLayout);
      }
    },
    renderLayout(layout: FacadeLayout): void {
      rebuild(layout);
      resize();
    },
    resize,
    destroy(): void {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      clearGroup(stage);
      controls.dispose();
      renderer.dispose();
      disposeObject(scene);
      renderer.domElement.remove();
    },
  };
}
