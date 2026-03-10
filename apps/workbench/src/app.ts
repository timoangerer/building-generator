import {
  buildFacadeLayout,
  createDefaultFacadeMap,
  createVerificationReport,
  createVerificationSnapshot,
  facadePresets,
  facadeSides,
  type FacadeDefinition,
  type FacadeMap,
  type FacadeSide,
  type WallSpec,
} from "@green-buses/facade-core";
import { createFacadeSvgString, renderFacadeSvg } from "@green-buses/facade-svg";
import { createFacadePreviewScene } from "@green-buses/facade-three";

import { getWorkbenchElements } from "./dom";
import { downloadText, slugify } from "./utils";
import { getExportText, renderComponentLibrary, renderSummary, type PreviewFacadeState } from "./view";

interface WorkbenchState {
  facades: FacadeMap;
  selectedSide: FacadeSide;
  wallWidth: number;
  floors: number;
  floorHeight: number;
  previewDepth: number;
}

function createInitialState(): WorkbenchState {
  return {
    facades: createDefaultFacadeMap(),
    selectedSide: "north",
    wallWidth: 18,
    floors: 5,
    floorHeight: 3.4,
    previewDepth: 2.6,
  };
}

function createWallSpec(state: WorkbenchState): WallSpec {
  return {
    side: state.selectedSide,
    width: state.wallWidth,
    height: state.floors * state.floorHeight,
    floors: state.floors,
    floorHeight: state.floorHeight,
    previewDepth: state.previewDepth,
  };
}

function isFacadeDefinition(value: unknown): value is FacadeDefinition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeFacade = value as Partial<FacadeDefinition>;
  return typeof maybeFacade.name === "string" && Array.isArray(maybeFacade.zones);
}

function getPreviewFacadeState(state: WorkbenchState, editorValue: string): PreviewFacadeState {
  const appliedFacade = state.facades[state.selectedSide];
  if (!editorValue.trim()) {
    return { facade: appliedFacade, mode: "applied", error: null };
  }

  try {
    const parsed = JSON.parse(editorValue) as unknown;
    if (!isFacadeDefinition(parsed)) {
      return {
        facade: appliedFacade,
        mode: "fallback",
        error: new Error("Facade JSON must contain a name and zones array."),
      };
    }
    return { facade: parsed, mode: "editor", error: null };
  } catch (error) {
    return {
      facade: appliedFacade,
      mode: "fallback",
      error: error instanceof Error ? error : new Error("Invalid JSON"),
    };
  }
}

export function mountWorkbench(): void {
  const elements = getWorkbenchElements();
  const state = createInitialState();
  const scene = createFacadePreviewScene(elements.stageMount);

  const updateDimensionLabels = (): void => {
    elements.wallWidthValue.textContent = `${state.wallWidth.toFixed(1)}m`;
    elements.floorsValue.textContent = String(state.floors);
    elements.floorHeightValue.textContent = `${state.floorHeight.toFixed(1)}m`;
    elements.previewDepthValue.textContent = `${state.previewDepth.toFixed(1)}m`;
    elements.totalHeightValue.textContent = `${(state.floors * state.floorHeight).toFixed(1)}m`;
  };

  const refreshEditor = (): void => {
    elements.facadeEditor.value = JSON.stringify(state.facades[state.selectedSide], null, 2);
  };

  const renderAll = () => {
    updateDimensionLabels();

    const facadeState = getPreviewFacadeState(state, elements.facadeEditor.value);
    if (facadeState.mode === "editor") {
      elements.previewStatus.textContent = "Live from editor";
      elements.previewStatus.classList.remove("error");
    } else if (facadeState.mode === "fallback") {
      elements.previewStatus.textContent = `Invalid JSON, showing applied ${state.selectedSide}`;
      elements.previewStatus.classList.add("error");
    } else {
      elements.previewStatus.textContent = "Applied facade";
      elements.previewStatus.classList.remove("error");
    }

    const layout = buildFacadeLayout(createWallSpec(state), facadeState.facade as FacadeDefinition);
    renderFacadeSvg(elements.elevationPreview, layout, { includeAnnotations: true });
    renderSummary(elements.summaryPanel, layout, facadeState);
    renderComponentLibrary(elements.componentLibrary, layout.components);
    elements.exportOutput.value = getExportText(layout, elements.exportViewSelect.value);
    scene.renderLayout(layout);

    return layout;
  };

  for (const side of facadeSides) {
    const option = document.createElement("option");
    option.value = side;
    option.textContent = side;
    elements.facadeSideSelect.append(option);
  }

  for (const [key, preset] of Object.entries(facadePresets)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = preset.name;
    elements.facadePresetSelect.append(option);
  }

  elements.facadeSideSelect.value = state.selectedSide;
  elements.facadePresetSelect.value = "classical";

  const loadPreset = (): void => {
    const presetKey = elements.facadePresetSelect.value as keyof typeof facadePresets;
    state.facades[state.selectedSide] = structuredClone(facadePresets[presetKey]);
    refreshEditor();
    renderAll();
  };

  const applyFacadeJson = (): void => {
    const parsed = JSON.parse(elements.facadeEditor.value) as unknown;
    if (!isFacadeDefinition(parsed)) {
      throw new Error("Facade JSON must contain a name and zones array.");
    }
    state.facades[state.selectedSide] = parsed;
    renderAll();
  };

  elements.loadPresetButton.addEventListener("click", loadPreset);
  elements.applyFacadeButton.addEventListener("click", () => {
    try {
      applyFacadeJson();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Invalid facade JSON: ${message}`);
    }
  });

  elements.downloadSvgButton.addEventListener("click", () => {
    const layout = buildFacadeLayout(createWallSpec(state), getPreviewFacadeState(state, elements.facadeEditor.value).facade as FacadeDefinition);
    downloadText(`${slugify(layout.facadeName)}-facade.svg`, createFacadeSvgString(layout), "image/svg+xml");
  });

  elements.downloadSnapshotButton.addEventListener("click", () => {
    const layout = buildFacadeLayout(createWallSpec(state), getPreviewFacadeState(state, elements.facadeEditor.value).facade as FacadeDefinition);
    downloadText(
      `${slugify(layout.facadeName)}-snapshot.json`,
      JSON.stringify(createVerificationSnapshot(layout), null, 2),
      "application/json"
    );
  });

  elements.downloadReportButton.addEventListener("click", () => {
    const layout = buildFacadeLayout(createWallSpec(state), getPreviewFacadeState(state, elements.facadeEditor.value).facade as FacadeDefinition);
    downloadText(`${slugify(layout.facadeName)}-report.txt`, createVerificationReport(layout), "text/plain");
  });

  elements.focusPreviewButton.addEventListener("click", () => {
    scene.focus();
  });

  elements.facadeSideSelect.addEventListener("change", () => {
    state.selectedSide = elements.facadeSideSelect.value as FacadeSide;
    refreshEditor();
    renderAll();
  });

  elements.facadeEditor.addEventListener("input", () => {
    renderAll();
  });

  elements.wallWidthInput.addEventListener("input", () => {
    state.wallWidth = Number(elements.wallWidthInput.value);
    renderAll();
  });

  elements.floorsInput.addEventListener("input", () => {
    state.floors = Number(elements.floorsInput.value);
    renderAll();
  });

  elements.floorHeightInput.addEventListener("input", () => {
    state.floorHeight = Number(elements.floorHeightInput.value);
    renderAll();
  });

  elements.previewDepthInput.addEventListener("input", () => {
    state.previewDepth = Number(elements.previewDepthInput.value);
    renderAll();
  });

  elements.exportViewSelect.addEventListener("change", () => {
    const layout = buildFacadeLayout(createWallSpec(state), getPreviewFacadeState(state, elements.facadeEditor.value).facade as FacadeDefinition);
    elements.exportOutput.value = getExportText(layout, elements.exportViewSelect.value);
  });

  refreshEditor();
  renderAll();
}
