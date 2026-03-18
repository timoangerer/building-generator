import * as THREE from "three";
import type { ElementCatalog, ElementDefinition, GeometryPart } from "@/contracts";
import { computeElementBounds } from "@/core-geometry";
import type { StageRenderer, RenderOptions } from "../shared/types";
import { createThreeContext, clearMeshes, disposeContext, type ThreeContext } from "../shared/three-setup";

const ROLE_COLORS: Record<string, number> = {
  pane: 0x1a2030,
  frame: 0xc0a070,
  shutter: 0x4a7050,
  arch: 0xb8956a,
  slab: 0x808080,
  railing: 0x505050,
  panel: 0x8b6b4a,
};

const WALL_COLOR = 0xe8dcc8;
const WALL_Z_OFFSET = -0.02;
const WALL_PADDING = 0.3;

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

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const fontSize = 28;
  const padding = 8;
  ctx.font = `${fontSize}px monospace`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 4);
  ctx.fill();

  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);

  const aspect = canvas.width / canvas.height;
  const spriteHeight = 0.22;
  sprite.scale.set(spriteHeight * aspect, spriteHeight, 1);

  return sprite;
}

type CellLayout = {
  element: ElementDefinition;
  ox: number;
  oy: number;
  bounds: ReturnType<typeof computeElementBounds>;
};

function computeGridLayout(elements: ElementDefinition[], spacing: number): {
  cells: CellLayout[];
  totalWidth: number;
  totalHeight: number;
} {
  const cols = Math.ceil(Math.sqrt(elements.length));
  const rows = Math.ceil(elements.length / cols);

  const boundsList = elements.map((el) => computeElementBounds(el));

  // Compute max width per column and max height per row
  const colWidths: number[] = new Array(cols).fill(0);
  const rowHeights: number[] = new Array(rows).fill(0);

  for (let i = 0; i < elements.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    colWidths[col] = Math.max(colWidths[col], boundsList[i].width);
    rowHeights[row] = Math.max(rowHeights[row], boundsList[i].height);
  }

  // Compute column X centers and row Y centers
  const colCenters: number[] = [];
  let cx = 0;
  for (let c = 0; c < cols; c++) {
    colCenters.push(cx + colWidths[c] / 2);
    cx += colWidths[c] + spacing;
  }
  const totalWidth = cx - spacing;

  const rowCenters: number[] = [];
  let cy = 0;
  for (let r = 0; r < rows; r++) {
    rowCenters.push(cy + rowHeights[r] / 2);
    cy += rowHeights[r] + spacing;
  }
  const totalHeight = cy - spacing;

  // Center the grid around origin
  const offsetX = totalWidth / 2;
  const offsetY = totalHeight / 2;

  const cells: CellLayout[] = [];
  for (let i = 0; i < elements.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cells.push({
      element: elements[i],
      ox: colCenters[col] - offsetX,
      oy: rowCenters[row] - offsetY,
      bounds: boundsList[i],
    });
  }

  return { cells, totalWidth, totalHeight };
}

export function createElementRenderer(): StageRenderer<ElementCatalog> {
  let ctx: ThreeContext | null = null;

  function build(result: ElementCatalog, options: RenderOptions) {
    if (!ctx) return;
    clearMeshes(ctx);

    const spacing = 1.0;
    const { cells, totalWidth, totalHeight } = computeGridLayout(result.elements, spacing);

    for (const cell of cells) {
      const { element: el, ox, oy, bounds } = cell;
      const group = new THREE.Group();
      group.position.set(ox, oy, 0);

      if (el.geometry.type === "box") {
        const box = el.geometry.box;
        const geo = new THREE.BoxGeometry(box.width, box.height, box.depth);
        const color = el.type === "window" ? 0x1a2030 : el.type === "door" ? 0x5a3a20 : 0x808080;
        const mat = new THREE.MeshToonMaterial({ color, wireframe: options.wireframe });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);
      } else {
        for (const part of el.geometry.parts) {
          const geo = buildPartGeometry(part);
          const color = ROLE_COLORS[part.role] ?? result.defaultPalette[part.role] ?? 0x808080;
          const mat = new THREE.MeshToonMaterial({ color, wireframe: options.wireframe });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(part.position.x, part.position.y, part.position.z);
          group.add(mesh);
        }
      }

      // Label below the element
      if (options.showLabels) {
        const label = `${el.elementId}  (${el.type})`;
        const sprite = createLabelSprite(label);
        const bottomY = bounds.offsetY - bounds.height / 2;
        sprite.position.set(bounds.offsetX, bottomY - 0.2, 0.05);
        group.add(sprite);
      }

      ctx.scene.add(group);
      ctx.meshes.push(group);
    }

    // Single wall backdrop behind all elements
    if (options.showWall) {
      const wallW = totalWidth + WALL_PADDING * 2;
      const wallH = totalHeight + WALL_PADDING * 2;
      const wallGeo = new THREE.PlaneGeometry(wallW, wallH);
      const wallMat = new THREE.MeshToonMaterial({ color: WALL_COLOR });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, 0, WALL_Z_OFFSET);
      ctx.scene.add(wall);
      ctx.meshes.push(wall);
    }

    // Adjust camera to face the wall
    const viewDist = Math.max(totalWidth, totalHeight) * 1.2;
    ctx.camera.position.set(0, 0, viewDist);
    ctx.controls.target.set(0, 0, 0);
    ctx.controls.update();
  }

  return {
    mount(container, result, options) {
      ctx = createThreeContext(container);
      build(result, options);
    },
    update(result, options) { build(result, options); },
    dispose() { if (ctx) { disposeContext(ctx); ctx = null; } },
  };
}
