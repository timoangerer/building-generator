import "../styles.css";

import { buildFacadeLayout, createVerificationReport, createVerificationSnapshot } from "./domain/facade-layout.js";
import {
  componentDescriptions,
  createDefaultFacadeMap,
  facadePresets,
  facadeSides,
} from "./domain/facade-presets.js";
import { createFacadeSvgString, renderFacadeSvg } from "./renderers/facade-svg.js";
import { createFacadePreviewScene } from "./scene/facade-preview-scene.js";

const facadeSideSelect = document.querySelector("#facadeSide");
const facadePresetSelect = document.querySelector("#facadePreset");
const wallWidthInput = document.querySelector("#wallWidth");
const wallWidthValue = document.querySelector("#wallWidthValue");
const floorsInput = document.querySelector("#floors");
const floorsValue = document.querySelector("#floorsValue");
const floorHeightInput = document.querySelector("#floorHeight");
const floorHeightValue = document.querySelector("#floorHeightValue");
const previewDepthInput = document.querySelector("#previewDepth");
const previewDepthValue = document.querySelector("#previewDepthValue");
const totalHeightValue = document.querySelector("#totalHeightValue");
const facadeEditor = document.querySelector("#facadeEditor");
const previewStatus = document.querySelector("#previewStatus");
const elevationPreview = document.querySelector("#elevationPreview");
const summaryPanel = document.querySelector("#summaryPanel");
const componentLibrary = document.querySelector("#componentLibrary");
const exportViewSelect = document.querySelector("#exportView");
const exportOutput = document.querySelector("#exportOutput");
const stageMount = document.querySelector("#stageMount");

const state = {
  facades: createDefaultFacadeMap(),
  selectedSide: "north",
  wallWidth: 18,
  floors: 5,
  floorHeight: 3.4,
  previewDepth: 2.6,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

for (const side of facadeSides) {
  const option = document.createElement("option");
  option.value = side;
  option.textContent = side;
  facadeSideSelect.append(option);
}

for (const [key, preset] of Object.entries(facadePresets)) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = preset.name;
  facadePresetSelect.append(option);
}

facadeSideSelect.value = state.selectedSide;
facadePresetSelect.value = "classical";

const scene = createFacadePreviewScene(stageMount);

function wallSpec() {
  return {
    side: state.selectedSide,
    width: state.wallWidth,
    height: state.floors * state.floorHeight,
    floors: state.floors,
    floorHeight: state.floorHeight,
    previewDepth: state.previewDepth,
  };
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getPreviewFacadeState() {
  const appliedFacade = state.facades[state.selectedSide];
  if (!facadeEditor.value.trim()) {
    return { facade: appliedFacade, mode: "applied", error: null };
  }

  try {
    return { facade: JSON.parse(facadeEditor.value), mode: "editor", error: null };
  } catch (error) {
    return { facade: appliedFacade, mode: "fallback", error };
  }
}

function refreshEditor() {
  facadeEditor.value = JSON.stringify(state.facades[state.selectedSide], null, 2);
}

function updateDimensionLabels() {
  wallWidthValue.textContent = `${state.wallWidth.toFixed(1)}m`;
  floorsValue.textContent = String(state.floors);
  floorHeightValue.textContent = `${state.floorHeight.toFixed(1)}m`;
  previewDepthValue.textContent = `${state.previewDepth.toFixed(1)}m`;
  totalHeightValue.textContent = `${(state.floors * state.floorHeight).toFixed(1)}m`;
}

function renderSummary(layout, facadeState) {
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

  summaryPanel.innerHTML = `
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

function renderComponentLibrary(components) {
  componentLibrary.replaceChildren();

  if (!components.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No components resolved from this facade definition.";
    componentLibrary.append(empty);
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
    componentLibrary.append(card);
  }
}

function getExportText(layout) {
  if (exportViewSelect.value === "snapshot") {
    return JSON.stringify(createVerificationSnapshot(layout), null, 2);
  }
  if (exportViewSelect.value === "svg") {
    return createFacadeSvgString(layout, { includeAnnotations: true });
  }
  return createVerificationReport(layout);
}

function renderAll() {
  updateDimensionLabels();

  const facadeState = getPreviewFacadeState();
  if (facadeState.mode === "editor") {
    previewStatus.textContent = "Live from editor";
    previewStatus.classList.remove("error");
  } else if (facadeState.mode === "fallback") {
    previewStatus.textContent = `Invalid JSON, showing applied ${state.selectedSide}`;
    previewStatus.classList.add("error");
  } else {
    previewStatus.textContent = "Applied facade";
    previewStatus.classList.remove("error");
  }

  const layout = buildFacadeLayout(wallSpec(), facadeState.facade);
  renderFacadeSvg(elevationPreview, layout, { includeAnnotations: true });
  renderSummary(layout, facadeState);
  renderComponentLibrary(layout.components);
  exportOutput.value = getExportText(layout);
  scene.renderLayout(layout);

  return layout;
}

function loadPreset() {
  state.facades[state.selectedSide] = structuredClone(facadePresets[facadePresetSelect.value]);
  refreshEditor();
  renderAll();
}

function applyFacadeJson() {
  state.facades[state.selectedSide] = JSON.parse(facadeEditor.value);
  renderAll();
}

document.querySelector("#loadPreset").addEventListener("click", loadPreset);
document.querySelector("#applyFacade").addEventListener("click", () => {
  try {
    applyFacadeJson();
  } catch (error) {
    alert(`Invalid facade JSON: ${error.message}`);
  }
});

document.querySelector("#downloadSvg").addEventListener("click", () => {
  const layout = buildFacadeLayout(wallSpec(), getPreviewFacadeState().facade);
  downloadText(`${slugify(layout.facadeName)}-facade.svg`, createFacadeSvgString(layout), "image/svg+xml");
});

document.querySelector("#downloadSnapshot").addEventListener("click", () => {
  const layout = buildFacadeLayout(wallSpec(), getPreviewFacadeState().facade);
  downloadText(
    `${slugify(layout.facadeName)}-snapshot.json`,
    JSON.stringify(createVerificationSnapshot(layout), null, 2),
    "application/json"
  );
});

document.querySelector("#downloadReport").addEventListener("click", () => {
  const layout = buildFacadeLayout(wallSpec(), getPreviewFacadeState().facade);
  downloadText(`${slugify(layout.facadeName)}-report.txt`, createVerificationReport(layout), "text/plain");
});

document.querySelector("#focusPreview").addEventListener("click", () => {
  scene.focus();
});

facadeSideSelect.addEventListener("change", () => {
  state.selectedSide = facadeSideSelect.value;
  refreshEditor();
  renderAll();
});

facadeEditor.addEventListener("input", () => {
  renderAll();
});

wallWidthInput.addEventListener("input", () => {
  state.wallWidth = Number(wallWidthInput.value);
  renderAll();
});

floorsInput.addEventListener("input", () => {
  state.floors = Number(floorsInput.value);
  renderAll();
});

floorHeightInput.addEventListener("input", () => {
  state.floorHeight = Number(floorHeightInput.value);
  renderAll();
});

previewDepthInput.addEventListener("input", () => {
  state.previewDepth = Number(previewDepthInput.value);
  renderAll();
});

exportViewSelect.addEventListener("change", () => {
  const layout = buildFacadeLayout(wallSpec(), getPreviewFacadeState().facade);
  exportOutput.value = getExportText(layout);
});

window.addEventListener("resize", () => scene.resize());

refreshEditor();
renderAll();
