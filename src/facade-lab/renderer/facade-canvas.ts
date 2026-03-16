import type { FacadeLabView } from "../data-source";
import type { ColorPalette } from "@/contracts";

export type ViewMode = "wireframe" | "rendered" | "overlay";

function hexToCSS(hex: number): string {
  return "#" + hex.toString(16).padStart(6, "0");
}

function setupViewportTransform(
  ctx: CanvasRenderingContext2D,
  wallLength: number,
  totalHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const padding = 40;
  const drawW = canvasWidth - padding * 2;
  const drawH = canvasHeight - padding * 2;
  const scaleX = drawW / wallLength;
  const scaleY = drawH / totalHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = padding + (drawW - wallLength * scale) / 2;
  const offsetY = padding + (drawH - totalHeight * scale) / 2;

  // Y is flipped: canvas Y goes down, facade Y goes up
  ctx.translate(offsetX, canvasHeight - offsetY);
  ctx.scale(scale, -scale);

  return scale;
}

type WireframeColors = {
  outline: string;
  margin: string;
  floor: string;
  bay: string;
  annotation: string;
  element: string;
  dimension: string;
};

const darkWireColors: WireframeColors = {
  outline: "#666",
  margin: "#888",
  floor: "#555",
  bay: "#444",
  annotation: "#999",
  element: "#0af",
  dimension: "#777",
};

const overlayWireColors: WireframeColors = {
  outline: "rgba(0,0,0,0.6)",
  margin: "rgba(0,0,0,0.4)",
  floor: "rgba(0,0,0,0.3)",
  bay: "rgba(0,0,0,0.15)",
  annotation: "rgba(0,0,0,0.5)",
  element: "rgba(220,40,40,0.8)",
  dimension: "rgba(0,0,0,0.45)",
};

function drawWireframe(
  ctx: CanvasRenderingContext2D,
  view: FacadeLabView,
  scale: number,
  colors: WireframeColors = darkWireColors,
) {
  const totalHeight =
    view.floors.length > 0
      ? view.floors[view.floors.length - 1].baseY +
        view.floors[view.floors.length - 1].height
      : 0;

  // Wall outline
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 2 / scale;
  ctx.strokeRect(0, 0, view.wall.length, totalHeight);

  // Edge margins (dashed)
  ctx.save();
  ctx.setLineDash([0.1, 0.1]);
  ctx.strokeStyle = colors.margin;
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  ctx.moveTo(view.edgeMargin, 0);
  ctx.lineTo(view.edgeMargin, totalHeight);
  ctx.moveTo(view.wall.length - view.edgeMargin, 0);
  ctx.lineTo(view.wall.length - view.edgeMargin, totalHeight);
  ctx.stroke();
  ctx.restore();

  // Floor lines
  ctx.strokeStyle = colors.floor;
  ctx.lineWidth = 1 / scale;
  for (const floor of view.floors) {
    ctx.beginPath();
    ctx.moveTo(0, floor.baseY);
    ctx.lineTo(view.wall.length, floor.baseY);
    ctx.stroke();
    ctx.moveTo(0, floor.baseY + floor.height);
    ctx.lineTo(view.wall.length, floor.baseY + floor.height);
    ctx.stroke();
  }

  // Bay grid vertical lines
  ctx.strokeStyle = colors.bay;
  ctx.lineWidth = 0.5 / scale;
  for (let b = 0; b <= view.bayCount; b++) {
    const x = view.edgeMargin + b * view.bayWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, totalHeight);
    ctx.stroke();
  }

  // Dimension annotations for bay width and floor height
  const fontSize = Math.max(0.15, 10 / scale);
  ctx.save();
  ctx.scale(1, -1); // Flip text back upright
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = colors.annotation;
  ctx.textAlign = "center";

  // Bay width label at top
  if (view.bayCount > 0) {
    const bx = view.edgeMargin + view.bayWidth / 2;
    ctx.fillText(
      `bay: ${view.bayWidth.toFixed(1)}m`,
      bx,
      -(totalHeight + fontSize * 0.5),
    );
  }

  // Floor height label on left
  if (view.floors.length > 0) {
    const f = view.floors[0];
    ctx.textAlign = "right";
    ctx.fillText(
      `${f.height.toFixed(1)}m`,
      -fontSize * 0.3,
      -(f.baseY + f.height / 2 - fontSize / 3),
    );
  }

  ctx.restore();

  // Element bounding rectangles with labels
  for (const placement of view.placements) {
    const bounds = view.elementBounds.get(placement.elementId);
    if (!bounds) continue;

    const sx = placement.scale?.x ?? 1;
    const sy = placement.scale?.y ?? 1;
    const w = bounds.width * sx;
    const h = bounds.height * sy;

    // Convert world position to wall-local coordinates
    const localX = worldToWallLocal(view, placement.position.x, placement.position.z);
    const localY = placement.position.y;

    // The bounding box center is offset from the element origin
    const cx = localX + bounds.offsetX * sx;
    const cy = localY + bounds.offsetY * sy;

    ctx.strokeStyle = colors.element;
    ctx.lineWidth = 1.5 / scale;
    ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

    // Label
    ctx.save();
    ctx.scale(1, -1);
    const labelSize = Math.max(0.1, 8 / scale);
    ctx.font = `bold ${labelSize}px monospace`;
    ctx.fillStyle = colors.element;
    ctx.textAlign = "center";
    ctx.fillText(
      placement.elementId,
      cx,
      -(cy + h / 2 + labelSize * 0.3),
    );
    // Dimension annotation
    ctx.font = `${labelSize}px monospace`;
    ctx.fillStyle = colors.dimension;
    ctx.fillText(
      `${w.toFixed(2)}×${h.toFixed(2)}`,
      cx,
      -(cy - h / 2 - labelSize * 1.2),
    );
    ctx.restore();
  }
}

function drawRendered(
  ctx: CanvasRenderingContext2D,
  view: FacadeLabView,
  palette: ColorPalette,
  scale: number,
) {
  const totalHeight =
    view.floors.length > 0
      ? view.floors[view.floors.length - 1].baseY +
        view.floors[view.floors.length - 1].height
      : 0;

  // Wall background
  ctx.fillStyle = "#e8ddd0";
  ctx.fillRect(0, 0, view.wall.length, totalHeight);

  // Subtle gray grid
  ctx.strokeStyle = "#ccc4b8";
  ctx.lineWidth = 0.5 / scale;
  for (let b = 0; b <= view.bayCount; b++) {
    const x = view.edgeMargin + b * view.bayWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, totalHeight);
    ctx.stroke();
  }
  for (const floor of view.floors) {
    ctx.beginPath();
    ctx.moveTo(0, floor.baseY);
    ctx.lineTo(view.wall.length, floor.baseY);
    ctx.stroke();
  }

  // Draw element composite parts
  for (const placement of view.placements) {
    const elDef = view.elementCatalog.get(placement.elementId);
    if (!elDef || elDef.geometry.type !== "composite") continue;

    const sx = placement.scale?.x ?? 1;
    const sy = placement.scale?.y ?? 1;

    const localX = worldToWallLocal(view, placement.position.x, placement.position.z);
    const localY = placement.position.y;

    for (const part of elDef.geometry.parts) {
      if (part.shape === "cylinder" || part.shape === "half_cylinder") {
        // Draw as rectangle approximation
        let pw: number, ph: number;
        if (part.shape === "cylinder") {
          pw = part.dimensions.radius * 2;
          ph = part.dimensions.height;
        } else {
          pw = part.dimensions.radius * 2;
          ph = part.dimensions.radius;
        }
        const px = localX + part.position.x * sx;
        const py = localY + part.position.y * sy;
        ctx.fillStyle = hexToCSS(palette[part.role] ?? 0x808080);
        ctx.fillRect(
          px - (pw * sx) / 2,
          py - (part.shape === "half_cylinder" ? 0 : (ph * sy) / 2),
          pw * sx,
          ph * sy,
        );
      } else {
        // Box
        const pw = part.dimensions.width * sx;
        const ph = part.dimensions.height * sy;
        const px = localX + part.position.x * sx;
        const py = localY + part.position.y * sy;
        ctx.fillStyle = hexToCSS(palette[part.role] ?? 0x808080);
        ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
      }
    }
  }
}

function worldToWallLocal(
  view: FacadeLabView,
  worldX: number,
  worldZ: number,
): number {
  // Project world position onto wall direction
  const dx = view.wall.end.x - view.wall.start.x;
  const dz = view.wall.end.z - view.wall.start.z;
  const len = view.wall.length;
  if (len === 0) return 0;

  const relX = worldX - view.wall.start.x;
  const relZ = worldZ - view.wall.start.z;
  // Dot product with wall direction unit vector
  const t = (relX * dx + relZ * dz) / (len * len);
  return t * len;
}

export function renderFacade2D(
  ctx: CanvasRenderingContext2D,
  view: FacadeLabView,
  mode: ViewMode,
  palette: ColorPalette,
) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = mode === "wireframe" ? "#1a1a2e" : "#f5f0eb";
  ctx.fillRect(0, 0, w, h);

  const totalHeight =
    view.floors.length > 0
      ? view.floors[view.floors.length - 1].baseY +
        view.floors[view.floors.length - 1].height
      : 1;

  ctx.save();
  const scale = setupViewportTransform(
    ctx,
    view.wall.length,
    totalHeight,
    w,
    h,
  );

  if (mode === "wireframe") {
    drawWireframe(ctx, view, scale, darkWireColors);
  } else if (mode === "rendered") {
    drawRendered(ctx, view, palette, scale);
  } else {
    // Overlay: rendered first, then wireframe on top
    drawRendered(ctx, view, palette, scale);
    drawWireframe(ctx, view, scale, overlayWireColors);
  }

  ctx.restore();
}
