import type { FacadeResult, ElementDefinition } from "@/contracts";
import type { StageRenderer, RenderOptions } from "../shared/types";
import { renderFacade2D } from "./facade-canvas";
import type { ViewMode } from "./facade-canvas";
import type { FacadeLabView } from "./facade-data";
import { computeElementBounds, type ElementBounds } from "@/core-geometry";
import { generateElementCatalog } from "@/generators/element";

const defaultPalette = generateElementCatalog({ seed: 1 }).defaultPalette;

function facadeResultToView(result: FacadeResult): FacadeLabView | null {
  const elementCatalog = new Map<string, ElementDefinition>();
  const elementBounds = new Map<string, ElementBounds>();
  for (const el of result.config.availableElements) {
    elementCatalog.set(el.elementId, el);
    elementBounds.set(el.elementId, computeElementBounds(el));
  }

  // Pick the first exposed (non-party) wall
  for (const facade of result.facades) {
    const wall = result.config.walls.find(
      (w) => w.buildingId === facade.buildingId && w.wallIndex === facade.wallIndex,
    );
    if (!wall || wall.neighborBuildingId) continue;

    const usableWidth = Math.max(0, wall.length - 2 * result.config.edgeMargin);
    const bayCount = Math.max(0, Math.floor(usableWidth / result.config.bayWidth));

    return {
      wall,
      floors: result.config.floors,
      bayWidth: result.config.bayWidth,
      edgeMargin: result.config.edgeMargin,
      placements: facade.placements,
      elementCatalog,
      elementBounds,
      palette: defaultPalette,
      bayCount,
      usableWidth,
    };
  }

  return null;
}

function renderCanvas(canvas: HTMLCanvasElement, view: FacadeLabView, mode: ViewMode) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  renderFacade2D(ctx, view, mode, view.palette);
}

export function createFacadeRenderer(): StageRenderer<FacadeResult> {
  let container: HTMLElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let currentView: FacadeLabView | null = null;
  let currentMode: ViewMode = "overlay";
  let observer: ResizeObserver | null = null;

  function render() {
    if (canvas && currentView) {
      renderCanvas(canvas, currentView, currentMode);
    }
  }

  return {
    mount(parentContainer, result, options) {
      container = parentContainer;
      currentMode = options.wireframe ? "wireframe" : "overlay";
      currentView = facadeResultToView(result);

      canvas = document.createElement("canvas");
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      parentContainer.appendChild(canvas);

      requestAnimationFrame(() => render());

      observer = new ResizeObserver(() => render());
      observer.observe(parentContainer);
    },

    update(result, options) {
      currentMode = options.wireframe ? "wireframe" : "overlay";
      currentView = facadeResultToView(result);
      render();
    },

    dispose() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (canvas && container) {
        container.removeChild(canvas);
      }
      canvas = null;
      currentView = null;
      container = null;
    },
  };
}
