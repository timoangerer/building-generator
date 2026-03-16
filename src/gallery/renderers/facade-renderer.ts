import * as THREE from "three";
import type { FacadeResult } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "./three-setup";

export function createFacadeRenderer(): StageRenderer<FacadeResult> {
  let ctx: ThreeContext | null = null;

  function build(result: FacadeResult, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    // Render walls as transparent planes + placements as small cubes
    for (const facade of result.facades) {
      const wall = result.config.walls.find(
        (w) => w.buildingId === facade.buildingId && w.wallIndex === facade.wallIndex,
      );
      if (!wall) continue;

      // Wall plane (vertical)
      const wallLen = wall.length;
      const wallHeight = wall.height;
      const mx = (wall.start.x + wall.end.x) / 2;
      const mz = (wall.start.z + wall.end.z) / 2;
      const angle = Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);

      const isParty = !!wall.neighborBuildingId;
      const wallColor = isParty ? 0x553333 : 0x886644;

      const geo = new THREE.PlaneGeometry(wallLen, wallHeight);
      const mat = new THREE.MeshToonMaterial({
        color: wallColor,
        wireframe: options.wireframe,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(mx, wallHeight / 2, mz);
      mesh.rotation.y = -angle;
      ctx.scene.add(mesh);
      ctx.meshes.push(mesh);

      // Placements
      for (const p of facade.placements) {
        const pGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
        const pMat = new THREE.MeshToonMaterial({ color: 0x4a90d9, wireframe: options.wireframe });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(p.position.x, p.position.y, p.position.z);
        pMesh.rotation.y = p.rotationY;
        ctx.scene.add(pMesh);
        ctx.meshes.push(pMesh);
      }
    }
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container);
      // Position camera to see the facade
      const walls = result.config.walls;
      const allX = walls.flatMap((w) => [w.start.x, w.end.x]);
      const allZ = walls.flatMap((w) => [w.start.z, w.end.z]);
      const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
      const cz = (Math.min(...allZ) + Math.max(...allZ)) / 2;
      ctx.camera.position.set(cx, 8, cz + 20);
      ctx.controls.target.set(cx, 4, cz);
      ctx.controls.update();
      build(result, options);
    },
    update(result, options) { build(result, options); },
    dispose() { if (ctx) { disposeContext(ctx); ctx = null; } },
  };
}
