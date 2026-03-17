import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SceneResult, ElementDefinition, GeometryPart, ColorPalette } from "@/contracts";
import { buildPartGeometry, buildingBaseColor } from "../shared/geometry";
import type { StageRenderer, RenderOptions } from "../shared/types";

export function createSceneRenderer(): StageRenderer<SceneResult> {
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let animId = 0;
  let container: HTMLElement | null = null;
  let onResize: (() => void) | null = null;
  let meshes: THREE.Object3D[] = [];

  function buildScene(sceneResult: SceneResult, options: RenderOptions) {
    if (!scene) return;

    // Clear previous meshes
    for (const m of meshes) scene.remove(m);
    meshes = [];

    const seed = sceneResult.config.seed;
    const palette = sceneResult.scene.elementCatalog.defaultPalette;
    const elementMap = new Map<string, ElementDefinition>();
    for (const el of sceneResult.scene.elementCatalog.elements) {
      elementMap.set(el.elementId, el);
    }

    // Buildings
    for (let bi = 0; bi < sceneResult.scene.buildings.length; bi++) {
      const building = sceneResult.scene.buildings[bi];
      const m = building.massing;
      const bx = m.footprint.reduce((s, v) => s + v.x, 0) / m.footprint.length;
      const bz = m.footprint.reduce((s, v) => s + v.z, 0) / m.footprint.length;

      let w = 0, d = 0;
      for (const v of m.footprint) {
        w = Math.max(w, Math.abs(v.x - bx) * 2);
        d = Math.max(d, Math.abs(v.z - bz) * 2);
      }

      const color = buildingBaseColor(seed, bi);
      const mat = new THREE.MeshToonMaterial({ color, wireframe: options.wireframe });
      const geo = new THREE.BoxGeometry(w, m.totalHeight, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bx, m.totalHeight / 2, bz);
      scene.add(mesh);
      meshes.push(mesh);
    }

    // Facade elements
    const placementsByElement = new Map<
      string,
      { x: number; y: number; z: number; rotationY: number }[]
    >();

    for (const building of sceneResult.scene.buildings) {
      for (const facade of building.facades) {
        for (const placement of facade.placements) {
          const list = placementsByElement.get(placement.elementId) ?? [];
          list.push({
            x: placement.position.x,
            y: placement.position.y,
            z: placement.position.z,
            rotationY: placement.rotationY,
          });
          placementsByElement.set(placement.elementId, list);
        }
      }
    }

    const dummy = new THREE.Object3D();

    function paletteColor(role: string): number {
      return palette[role] ?? 0x808080;
    }

    for (const [elementId, placements] of placementsByElement) {
      const elDef = elementMap.get(elementId);
      if (!elDef) continue;

      if (elDef.geometry.type === "box") {
        const box = elDef.geometry.box;
        const geo = new THREE.BoxGeometry(box.width, box.height, box.depth);
        let matColor: number;
        if (elDef.type === "window") matColor = 0x1a2030;
        else if (elDef.type === "door") matColor = 0x5a3a20;
        else matColor = 0x808080;
        const mat = new THREE.MeshToonMaterial({ color: matColor, wireframe: options.wireframe });
        const im = new THREE.InstancedMesh(geo, mat, placements.length);
        for (let i = 0; i < placements.length; i++) {
          const p = placements[i];
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(0, p.rotationY, 0);
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
        scene.add(im);
        meshes.push(im);
      } else {
        const partsByRole = new Map<string, GeometryPart[]>();
        for (const part of elDef.geometry.parts) {
          const list = partsByRole.get(part.role) ?? [];
          list.push(part);
          partsByRole.set(part.role, list);
        }

        for (const [role, parts] of partsByRole) {
          const mergedParts: THREE.BufferGeometry[] = [];
          for (const part of parts) {
            const partGeo = buildPartGeometry(part);
            partGeo.translate(part.position.x, part.position.y, part.position.z);
            mergedParts.push(partGeo);
          }

          let mergedGeo: THREE.BufferGeometry;
          if (mergedParts.length === 1) mergedGeo = mergedParts[0];
          else mergedGeo = mergeGeometries(mergedParts, false) ?? mergedParts[0];

          const mat = new THREE.MeshToonMaterial({ color: paletteColor(role), wireframe: options.wireframe });
          const im = new THREE.InstancedMesh(mergedGeo, mat, placements.length);
          for (let i = 0; i < placements.length; i++) {
            const p = placements[i];
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(0, p.rotationY, 0);
            dummy.updateMatrix();
            im.setMatrixAt(i, dummy.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
          scene.add(im);
          meshes.push(im);
        }
      }
    }

    // Streets
    for (const street of sceneResult.scene.streets) {
      const sx = (street.start.x + street.end.x) / 2;
      const sz = (street.start.z + street.end.z) / 2;
      const dx = street.end.x - street.start.x;
      const dz = street.end.z - street.start.z;
      const len = Math.sqrt(dx * dx + dz * dz);

      const geo = new THREE.PlaneGeometry(len, street.width);
      const mat = new THREE.MeshToonMaterial({ color: 0x707080, wireframe: options.wireframe });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(sx, 0.01, sz);
      if (Math.abs(dz) > Math.abs(dx)) mesh.rotation.z = Math.PI / 2;
      scene.add(mesh);
      meshes.push(mesh);
    }

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshToonMaterial({ color: 0xa0a0a0, wireframe: options.wireframe });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);
    meshes.push(ground);
  }

  return {
    mount(el, result, options) {
      container = el;
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      el.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd0d0d0);

      camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 500);
      const bounds = result.scene.sceneBounds;
      const cx = (bounds.min.x + bounds.max.x) / 2;
      const cz = (bounds.min.z + bounds.max.z) / 2;
      camera.position.set(cx + 30, 25, cz + 30);
      camera.lookAt(cx, 0, cz);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(cx, 0, cz);
      controls.update();

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(20, 30, 10);
      scene.add(dirLight);
      scene.add(new THREE.AmbientLight(0x808080, 0.8));

      buildScene(result, options);

      const cam = camera;
      const ren = renderer;
      const ctrl = controls;
      const sc = scene;

      function animate() {
        animId = requestAnimationFrame(animate);
        ctrl.update();
        ren.render(sc, cam);
      }
      animate();

      onResize = () => {
        cam.aspect = el.clientWidth / el.clientHeight;
        cam.updateProjectionMatrix();
        ren.setSize(el.clientWidth, el.clientHeight);
      };
      window.addEventListener("resize", onResize);
    },

    update(result, options) {
      buildScene(result, options);
    },

    dispose() {
      cancelAnimationFrame(animId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (renderer) {
        renderer.dispose();
        if (container && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
      controls?.dispose();
      renderer = null;
      scene = null;
      camera = null;
      controls = null;
      container = null;
      meshes = [];
    },
  };
}
