import React, { useRef, useEffect, useCallback } from "react";
import type { PlotResult } from "@/contracts";

interface PlotCanvasProps {
  plotResult: PlotResult;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

// Row A: warm oranges, Row B: cool blues
function plotColor(row: "A" | "B", index: number): string {
  if (row === "A") {
    const hue = 20 + (index * 37) % 30; // 20–50 range (orange-amber)
    const sat = 60 + (index * 13) % 20;
    const light = 45 + (index * 17) % 15;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  } else {
    const hue = 200 + (index * 37) % 40; // 200–240 range (blue-indigo)
    const sat = 55 + (index * 13) % 20;
    const light = 45 + (index * 17) % 15;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }
}

function plotStroke(row: "A" | "B"): string {
  return row === "A" ? "hsl(25, 70%, 30%)" : "hsl(220, 60%, 30%)";
}

function computeAutoFit(
  plotResult: PlotResult,
  canvasWidth: number,
  canvasHeight: number,
): ViewState {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const plot of plotResult.plots) {
    minX = Math.min(minX, plot.bounds.min.x);
    maxX = Math.max(maxX, plot.bounds.max.x);
    minZ = Math.min(minZ, plot.bounds.min.z);
    maxZ = Math.max(maxZ, plot.bounds.max.z);
  }

  for (const street of plotResult.streets) {
    minX = Math.min(minX, street.start.x, street.end.x);
    maxX = Math.max(maxX, street.start.x, street.end.x);
    minZ = Math.min(minZ, street.start.z - street.width / 2, street.end.z - street.width / 2);
    maxZ = Math.max(maxZ, street.start.z + street.width / 2, street.end.z + street.width / 2);
  }

  const worldW = maxX - minX || 1;
  const worldH = maxZ - minZ || 1;
  const padding = 40;
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const scale = Math.min(availW / worldW, availH / worldH);

  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return {
    offsetX: canvasWidth / 2 - cx * scale,
    offsetY: canvasHeight / 2 + cz * scale, // flip Z: positive Z goes up on screen
    scale,
  };
}

function render(
  ctx: CanvasRenderingContext2D,
  plotResult: PlotResult,
  view: ViewState,
  canvasWidth: number,
  canvasHeight: number,
) {
  const { offsetX, offsetY, scale } = view;

  // world coords to screen
  const toScreenX = (wx: number) => wx * scale + offsetX;
  const toScreenY = (wz: number) => -wz * scale + offsetY; // flip Z

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  ctx.fillStyle = "#18181b"; // zinc-900
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw streets
  for (const street of plotResult.streets) {
    const sx = toScreenX(street.start.x);
    const sy = toScreenY(street.start.z + street.width / 2);
    const ex = toScreenX(street.end.x);
    const ey = toScreenY(street.end.z - street.width / 2);
    const w = ex - sx;
    const h = ey - sy;

    ctx.fillStyle = "#52525b"; // zinc-600
    ctx.fillRect(sx, sy, w, h);
    ctx.strokeStyle = "#71717a"; // zinc-500
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, w, h);

    // Street label
    const labelSize = Math.min(14, scale * street.width * 0.3);
    if (labelSize > 6) {
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `${labelSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(street.id, sx + w / 2, sy + h / 2);
    }
  }

  // Draw plots — track row indices for color variation
  let rowAIndex = 0;
  let rowBIndex = 0;
  for (const plot of plotResult.plots) {
    const index = plot.row === "A" ? rowAIndex++ : rowBIndex++;
    const { min, max } = plot.bounds;
    const sx = toScreenX(min.x);
    const sy = toScreenY(max.z); // max.z is top in world, but maps to lower screen Y
    const w = (max.x - min.x) * scale;
    const h = (max.z - min.z) * scale;

    ctx.fillStyle = plotColor(plot.row, index);
    ctx.fillRect(sx, sy, w, h);
    ctx.strokeStyle = plotStroke(plot.row);
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, w, h);

    // Plot ID label
    const labelSize = Math.min(13, Math.min(w, h) * 0.25);
    if (labelSize > 5) {
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${labelSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(plot.id, sx + w / 2, sy + h / 2);
    }
  }
}

export function PlotCanvas({ plotResult }: PlotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const plotResultRef = useRef(plotResult);
  plotResultRef.current = plotResult;
  const hasInitialFit = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    render(ctx, plotResultRef.current, viewRef.current, canvas.width, canvas.height);
  }, []);

  // Redraw when plotResult changes, but only auto-fit on first render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasInitialFit.current) {
      viewRef.current = computeAutoFit(plotResult, canvas.width, canvas.height);
      hasInitialFit.current = true;
    }
    draw();
  }, [plotResult, draw]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      // Store display size for coordinate calculations
      canvas.dataset.displayWidth = String(rect.width);
      canvas.dataset.displayHeight = String(rect.height);
      viewRef.current = computeAutoFit(plotResultRef.current, rect.width, rect.height);
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const view = viewRef.current;

      // Zoom around cursor position
      view.offsetX = mx - (mx - view.offsetX) * zoomFactor;
      view.offsetY = my - (my - view.offsetY) * zoomFactor;
      view.scale *= zoomFactor;

      draw();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [draw]);

  // Mouse drag panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      viewRef.current.offsetX += dx;
      viewRef.current.offsetY += dy;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      draw();
    };

    const onMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
