import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { runCityPipeline } from "@/orchestrator";
import type { SceneResult, Building, ElementDefinition, GeometryPart, ColorPalette } from "@/contracts";
import { buildPartGeometry, buildingBaseColor } from "@/rendering";
import "../index.css";

function buildThreeScene(
  container: HTMLElement,
  sceneResult: SceneResult,
): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    500,
  );

  const bounds = sceneResult.scene.sceneBounds;
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cz = (bounds.min.z + bounds.max.z) / 2;
  camera.position.set(cx + 30, 25, cz + 30);
  camera.lookAt(cx, 0, cz);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(cx, 0, cz);
  controls.update();

  // Warm directional light
  const dirLight = new THREE.DirectionalLight(0xffd4a0, 1.2);
  dirLight.position.set(20, 30, 10);
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  // Buildings as box meshes with per-building color variation
  const seed = sceneResult.config.seed;

  for (let bi = 0; bi < sceneResult.scene.buildings.length; bi++) {
    const building = sceneResult.scene.buildings[bi];
    const m = building.massing;
    const bx =
      m.footprint.reduce((s, v) => s + v.x, 0) / m.footprint.length;
    const bz =
      m.footprint.reduce((s, v) => s + v.z, 0) / m.footprint.length;

    let w = 0;
    let d = 0;
    for (const v of m.footprint) {
      w = Math.max(w, Math.abs(v.x - bx) * 2);
      d = Math.max(d, Math.abs(v.z - bz) * 2);
    }

    const color = buildingBaseColor(seed, bi);
    const buildingMat = new THREE.MeshToonMaterial({ color });

    const geo = new THREE.BoxGeometry(w, m.totalHeight, d);
    const mesh = new THREE.Mesh(geo, buildingMat);
    mesh.position.set(bx, m.totalHeight / 2, bz);
    scene.add(mesh);
  }

  // Facade elements as InstancedMesh grouped by elementId
  const elementCatalog = sceneResult.scene.elementCatalog;
  const elementMap = new Map<string, ElementDefinition>();
  for (const el of elementCatalog.elements) {
    elementMap.set(el.elementId, el);
  }

  // Collect all placements grouped by elementId
  type PlacementEntry = { x: number; y: number; z: number; rotationY: number; sx: number; sy: number; sz: number };
  const placementsByElement = new Map<string, PlacementEntry[]>();

  for (const building of sceneResult.scene.buildings) {
    for (const facade of building.facades) {
      for (const placement of facade.placements) {
        const list = placementsByElement.get(placement.elementId) ?? [];
        list.push({
          x: placement.position.x,
          y: placement.position.y,
          z: placement.position.z,
          rotationY: placement.rotationY,
          sx: placement.scale?.x ?? 1,
          sy: placement.scale?.y ?? 1,
          sz: placement.scale?.z ?? 1,
        });
        placementsByElement.set(placement.elementId, list);
      }
    }
  }

  // Create InstancedMesh objects for facade elements
  const palette = elementCatalog.defaultPalette;
  const dummy = new THREE.Object3D();

  function paletteColor(role: string): number {
    return palette[role] ?? 0x808080;
  }

  for (const [elementId, placements] of placementsByElement) {
    const elDef = elementMap.get(elementId);
    if (!elDef) continue;

    if (elDef.geometry.type === "box") {
      // Backward compatible: single InstancedMesh for box geometry
      const box = elDef.geometry.box;
      const geo = new THREE.BoxGeometry(box.width, box.height, box.depth);
      let matColor: number;
      if (elDef.type === "window") {
        matColor = 0x1a2030;
      } else if (elDef.type === "door") {
        matColor = 0x5a3a20;
      } else {
        matColor = 0x808080;
      }
      const mat = new THREE.MeshToonMaterial({ color: matColor });
      const instancedMesh = new THREE.InstancedMesh(geo, mat, placements.length);
      for (let i = 0; i < placements.length; i++) {
        const p = placements[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(0, p.rotationY, 0);
        dummy.scale.set(p.sx, p.sy, p.sz);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(instancedMesh);
    } else {
      // Composite: one InstancedMesh per (elementId, role) with part offsets baked in
      // Group parts by role
      const partsByRole = new Map<string, GeometryPart[]>();
      for (const part of elDef.geometry.parts) {
        const list = partsByRole.get(part.role) ?? [];
        list.push(part);
        partsByRole.set(part.role, list);
      }

      for (const [role, parts] of partsByRole) {
        // Merge all parts of this role into a single BufferGeometry
        const mergedParts: THREE.BufferGeometry[] = [];
        for (const part of parts) {
          const partGeo = buildPartGeometry(part);
          partGeo.translate(part.position.x, part.position.y, part.position.z);
          mergedParts.push(partGeo);
        }

        let mergedGeo: THREE.BufferGeometry;
        if (mergedParts.length === 1) {
          mergedGeo = mergedParts[0];
        } else {
          mergedGeo = mergeGeometries(mergedParts, false) ?? mergedParts[0];
        }

        const mat = new THREE.MeshToonMaterial({ color: paletteColor(role) });
        const instancedMesh = new THREE.InstancedMesh(mergedGeo, mat, placements.length);

        for (let i = 0; i < placements.length; i++) {
          const p = placements[i];
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(0, p.rotationY, 0);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        scene.add(instancedMesh);
      }
    }
  }

  // Streets as flat planes
  const streetMat = new THREE.MeshToonMaterial({ color: 0x3a3a4a });

  for (const street of sceneResult.scene.streets) {
    const sx = (street.start.x + street.end.x) / 2;
    const sz = (street.start.z + street.end.z) / 2;
    const dx = street.end.x - street.start.x;
    const dz = street.end.z - street.start.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    const geo = new THREE.PlaneGeometry(len, street.width);
    const mesh = new THREE.Mesh(geo, streetMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(sx, 0.01, sz);

    if (Math.abs(dz) > Math.abs(dx)) {
      mesh.rotation.z = Math.PI / 2;
    }

    scene.add(mesh);
  }

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshToonMaterial({ color: 0x2a2a3a });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  let animId = 0;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const sceneResult = runCityPipeline(42);
    const cleanup = buildThreeScene(containerRef.current, sceneResult);
    return cleanup;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
    />
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
