import * as THREE from "three";
import type { MassingResult } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../shared/types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "../shared/three-setup";

const BUILDING_COLORS = [0x4a90d9, 0xd94a4a, 0x4ad97a, 0xd9c74a, 0x9a4ad9, 0xd97a4a];

export function createMassingRenderer(): StageRenderer<MassingResult> {
  let ctx: ThreeContext | null = null;

  function build(result: MassingResult, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    for (let bi = 0; bi < result.buildings.length; bi++) {
      const b = result.buildings[bi];
      const bx = b.footprint.reduce((s, v) => s + v.x, 0) / b.footprint.length;
      const bz = b.footprint.reduce((s, v) => s + v.z, 0) / b.footprint.length;

      let w = 0, d = 0;
      for (const v of b.footprint) {
        w = Math.max(w, Math.abs(v.x - bx) * 2);
        d = Math.max(d, Math.abs(v.z - bz) * 2);
      }

      const color = BUILDING_COLORS[bi % BUILDING_COLORS.length];
      const mat = new THREE.MeshToonMaterial({
        color,
        wireframe: options.wireframe,
        transparent: true,
        opacity: 0.6,
      });

      const geo = new THREE.BoxGeometry(w, b.totalHeight, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(bx, b.totalHeight / 2, bz);
      ctx.scene.add(mesh);
      ctx.meshes.push(mesh);

      // Floor lines
      for (const floor of b.floors) {
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
    }
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container);
      const allX = result.buildings.flatMap((b) => b.footprint.map((v) => v.x));
      const allZ = result.buildings.flatMap((b) => b.footprint.map((v) => v.z));
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
