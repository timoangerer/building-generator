import * as THREE from "three";
import type { ElementCatalog, GeometryPart } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "./three-setup";

const ROLE_COLORS: Record<string, number> = {
  pane: 0x1a2030,
  frame: 0xc0a070,
  shutter: 0x4a7050,
  arch: 0xb8956a,
  slab: 0x808080,
  railing: 0x505050,
  panel: 0x8b6b4a,
};

function buildPartGeometry(part: GeometryPart): THREE.BufferGeometry {
  switch (part.shape) {
    case "box":
      return new THREE.BoxGeometry(
        part.dimensions.width,
        part.dimensions.height,
        part.dimensions.depth,
      );
    case "cylinder":
      return new THREE.CylinderGeometry(
        part.dimensions.radius,
        part.dimensions.radius,
        part.dimensions.height,
        16,
      );
    case "half_cylinder": {
      const geo = new THREE.CylinderGeometry(
        part.dimensions.radius,
        part.dimensions.radius,
        part.dimensions.depth,
        16, 1, false,
        Math.PI / 2, Math.PI,
      );
      geo.rotateX(Math.PI / 2);
      return geo;
    }
  }
}

export function createElementRenderer(): StageRenderer<ElementCatalog> {
  let ctx: ThreeContext | null = null;

  function build(result: ElementCatalog, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    const cols = Math.ceil(Math.sqrt(result.elements.length));
    const spacing = 2.5;

    for (let i = 0; i < result.elements.length; i++) {
      const el = result.elements[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ox = col * spacing - (cols - 1) * spacing / 2;
      const oz = row * spacing - (Math.ceil(result.elements.length / cols) - 1) * spacing / 2;

      if (el.geometry.type === "box") {
        const box = el.geometry.box;
        const geo = new THREE.BoxGeometry(box.width, box.height, box.depth);
        const color = el.type === "window" ? 0x1a2030 : el.type === "door" ? 0x5a3a20 : 0x808080;
        const mat = new THREE.MeshToonMaterial({ color, wireframe: options.wireframe });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, box.height / 2, oz);
        ctx.scene.add(mesh);
        ctx.meshes.push(mesh);
      } else {
        for (const part of el.geometry.parts) {
          const geo = buildPartGeometry(part);
          const color = ROLE_COLORS[part.role] ?? result.defaultPalette[part.role] ?? 0x808080;
          const mat = new THREE.MeshToonMaterial({ color, wireframe: options.wireframe });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(
            ox + part.position.x,
            part.position.y,
            oz + part.position.z,
          );
          ctx.scene.add(mesh);
          ctx.meshes.push(mesh);
        }
      }
    }
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container);
      ctx.camera.position.set(5, 5, 5);
      ctx.controls.target.set(0, 0.5, 0);
      ctx.controls.update();
      build(result, options);
    },
    update(result, options) { build(result, options); },
    dispose() { if (ctx) { disposeContext(ctx); ctx = null; } },
  };
}
