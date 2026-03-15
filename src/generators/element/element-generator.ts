import type { ElementCatalogConfig, ElementCatalog } from "@/contracts";

export function generateElementCatalog(
  config: ElementCatalogConfig,
): ElementCatalog {
  return {
    config,
    elements: [
      {
        elementId: "window-small",
        type: "window",
        geometry: { type: "box", box: { width: 0.8, height: 1.0, depth: 0.1 } },
      },
      {
        elementId: "window-large",
        type: "window",
        geometry: { type: "box", box: { width: 1.2, height: 1.4, depth: 0.1 } },
      },
      {
        elementId: "door-standard",
        type: "door",
        geometry: { type: "box", box: { width: 1.0, height: 2.2, depth: 0.05 } },
      },
      {
        elementId: "wall-panel",
        type: "wall_panel",
        geometry: { type: "box", box: { width: 1.0, height: 1.0, depth: 0.02 } },
      },
    ],
  };
}
