import { componentDescriptions, createVerificationReport, createVerificationSnapshot, type FacadeLayout } from "@green-buses/facade-core";
import { createFacadeSvgString } from "@green-buses/facade-svg";

import { escapeHtml } from "./utils";

export type PreviewMode = "applied" | "editor" | "fallback";

export interface PreviewFacadeState {
  facade: unknown;
  mode: PreviewMode;
  error: Error | null;
}

export function renderSummary(container: HTMLElement, layout: FacadeLayout, facadeState: PreviewFacadeState): void {
  const modeLabel =
    facadeState.mode === "editor"
      ? "Live editor preview"
      : facadeState.mode === "fallback"
        ? "Applied facade fallback"
        : "Applied facade";

  const componentBreakdown = layout.components
    .map(
      (component) =>
        `<li><strong>${escapeHtml(component.type)}</strong> ${component.count} instance${
          component.count === 1 ? "" : "s"
        }</li>`
    )
    .join("");

  const zoneBreakdown = layout.zones
    .map(
      (zone) =>
        `<li><strong>${escapeHtml(zone.key)}</strong> ${zone.height.toFixed(2)}m tall, ${zone.rows.length} row${
          zone.rows.length === 1 ? "" : "s"
        }, inset ${zone.inset.toFixed(2)}m</li>`
    )
    .join("");

  container.innerHTML = `
    <div class="summary-block">
      <p class="summary-kicker">Target wall</p>
      <h3>${escapeHtml(layout.facadeName)} on ${escapeHtml(layout.wall.side)}</h3>
      <p class="summary-copy">${escapeHtml(
        `${modeLabel}. The layout engine consumes the JSON and resolves zones, rows, repeats, and decorative instances against a single wall contract.`
      )}</p>
    </div>
    <div class="metric-grid">
      <article><span>Width</span><strong>${layout.wall.width.toFixed(1)}m</strong></article>
      <article><span>Height</span><strong>${layout.wall.height.toFixed(1)}m</strong></article>
      <article><span>Area</span><strong>${layout.summary.area.toFixed(1)}sqm</strong></article>
      <article><span>Rows</span><strong>${layout.summary.rowCount}</strong></article>
    </div>
    <div class="summary-list">
      <p class="summary-kicker">Zones</p>
      <ul>${zoneBreakdown}</ul>
    </div>
    <div class="summary-list">
      <p class="summary-kicker">Components</p>
      <ul>${componentBreakdown || "<li>No components resolved.</li>"}</ul>
    </div>
  `;
}

export function renderComponentLibrary(container: HTMLElement, components: FacadeLayout["components"]): void {
  container.replaceChildren();

  if (!components.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No components resolved from this facade definition.";
    container.append(empty);
    return;
  }

  for (const component of components) {
    const card = document.createElement("article");
    card.className = "library-card";

    const thumb = document.createElement("div");
    const thumbClass = /^(window|glass|door|entry|oculus|screen|balcony)$/.test(component.type)
      ? component.type
      : "unknown";
    thumb.className = `library-thumb ${thumbClass}`;
    if (thumbClass === "screen" || thumbClass === "unknown") {
      const shape = document.createElement("div");
      shape.className = "shape";
      thumb.append(shape);
    }

    const title = document.createElement("h4");
    title.textContent = component.type;

    const meta = document.createElement("p");
    meta.textContent = `${component.count} instance${component.count === 1 ? "" : "s"} on ${
      component.zones.join(", ") || "unassigned"
    } zones`;

    const note = document.createElement("p");
    note.textContent = componentDescriptions[component.type] || "Custom component type from the facade JSON.";

    card.append(thumb, title, meta, note);
    container.append(card);
  }
}

export function getExportText(layout: FacadeLayout, exportView: string): string {
  if (exportView === "snapshot") {
    return JSON.stringify(createVerificationSnapshot(layout), null, 2);
  }

  if (exportView === "svg") {
    return createFacadeSvgString(layout, { includeAnnotations: true });
  }

  return createVerificationReport(layout);
}
