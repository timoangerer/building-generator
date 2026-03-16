import * as THREE from "three";
import type { PlotResult } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "./three-setup";

export function createPlotRenderer(): StageRenderer<PlotResult> {
  let ctx: ThreeContext | null = null;

  function build(result: PlotResult, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    const rowAColor = 0x4a90d9;
    const rowBColor = 0xd94a4a;

    for (const plot of result.plots) {
      const xs = plot.footprint.map((v) => v.x);
      const zs = plot.footprint.map((v) => v.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const w = maxX - minX;
      const d = maxZ - minZ;
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;

      const color = plot.row === "A" ? rowAColor : rowBColor;
      const geo = new THREE.PlaneGeometry(w, d);
      const mat = new THREE.MeshToonMaterial({
        color,
        wireframe: options.wireframe,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, 0, cz);
      ctx.scene.add(mesh);
      ctx.meshes.push(mesh);

      // Outline
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      const line = new THREE.LineSegments(edges, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(cx, 0.01, cz);
      ctx.scene.add(line);
      ctx.meshes.push(line);
    }

    // Street
    for (const street of result.streets) {
      const sx = (street.start.x + street.end.x) / 2;
      const sz = (street.start.z + street.end.z) / 2;
      const dx = street.end.x - street.start.x;
      const dz = street.end.z - street.start.z;
      const len = Math.sqrt(dx * dx + dz * dz);

      const geo = new THREE.PlaneGeometry(len, street.width);
      const mat = new THREE.MeshToonMaterial({ color: 0x3a3a4a });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(sx, -0.01, sz);
      if (Math.abs(dz) > Math.abs(dx)) mesh.rotation.z = Math.PI / 2;
      ctx.scene.add(mesh);
      ctx.meshes.push(mesh);
    }
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container, { orthographic: true });
      // Center on plots
      const allX = result.plots.flatMap((p) => p.footprint.map((v) => v.x));
      const allZ = result.plots.flatMap((p) => p.footprint.map((v) => v.z));
      const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
      const cz = (Math.min(...allZ) + Math.max(...allZ)) / 2;
      ctx.camera.position.set(cx, 50, cz);
      ctx.controls.target.set(cx, 0, cz);
      ctx.controls.update();
      build(result, options);
    },
    update(result, options) { build(result, options); },
    dispose() { if (ctx) { disposeContext(ctx); ctx = null; } },
  };
}
