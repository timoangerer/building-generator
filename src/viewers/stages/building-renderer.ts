import * as THREE from "three";
import type { BuildingResult } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../shared/types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "../shared/three-setup";

const BUILDING_COLORS = [0x4a90d9, 0xd94a4a, 0x4ad97a, 0xd9c74a, 0x9a4ad9, 0xd97a4a];

export function createBuildingRenderer(): StageRenderer<BuildingResult> {
  let ctx: ThreeContext | null = null;

  function build(result: BuildingResult, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    for (let bi = 0; bi < result.buildings.length; bi++) {
      const b = result.buildings[bi];
      const m = b.massing;
      const bx = m.footprint.reduce((s, v) => s + v.x, 0) / m.footprint.length;
      const bz = m.footprint.reduce((s, v) => s + v.z, 0) / m.footprint.length;

      let w = 0, d = 0;
      for (const v of m.footprint) {
        w = Math.max(w, Math.abs(v.x - bx) * 2);
        d = Math.max(d, Math.abs(v.z - bz) * 2);
      }

      const color = BUILDING_COLORS[bi % BUILDING_COLORS.length];
      const mat = new THREE.MeshToonMaterial({
        color,
        wireframe: options.wireframe,
      });

      const geo = new THREE.BoxGeometry(w, m.totalHeight, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bx, m.totalHeight / 2, bz);
      ctx.scene.add(mesh);
      ctx.meshes.push(mesh);

      // Floor lines
      for (const floor of m.floors) {
        const lineGeo = new THREE.PlaneGeometry(w + 0.1, d + 0.1);
        const lineMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(bx, floor.baseY, bz);
        ctx.scene.add(lineMesh);
        ctx.meshes.push(lineMesh);
      }

      // Wall outlines (highlight facade walls)
      for (const wall of m.walls) {
        const wx = (wall.start.x + wall.end.x) / 2;
        const wz = (wall.start.z + wall.end.z) / 2;
        const wallMat = new THREE.MeshToonMaterial({
          color: 0xffa040,
          wireframe: options.wireframe,
          transparent: true,
          opacity: 0.4,
        });
        const wallGeo = new THREE.PlaneGeometry(wall.length, wall.height);
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(wx + wall.normal.x * 0.05, wall.height / 2, wz + wall.normal.z * 0.05);

        // Orient the plane to face along the wall normal
        const angle = Math.atan2(wall.normal.x, wall.normal.z);
        wallMesh.rotation.y = angle;

        ctx.scene.add(wallMesh);
        ctx.meshes.push(wallMesh);
      }
    }

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshToonMaterial({ color: 0xa0a0a0, wireframe: options.wireframe });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ctx.scene.add(ground);
    ctx.meshes.push(ground);
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container);

      const allX = result.buildings.flatMap((b) => b.massing.footprint.map((v) => v.x));
      const allZ = result.buildings.flatMap((b) => b.massing.footprint.map((v) => v.z));
      const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
      const cz = (Math.min(...allZ) + Math.max(...allZ)) / 2;
      ctx.camera.position.set(cx + 20, 15, cz + 20);
      ctx.controls.target.set(cx, 5, cz);
      ctx.controls.update();

      build(result, options);
    },
    update(result, options) { build(result, options); },
    dispose() { if (ctx) { disposeContext(ctx); ctx = null; } },
  };
}
