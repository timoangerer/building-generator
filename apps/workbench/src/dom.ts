function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

export interface WorkbenchElements {
  facadeSideSelect: HTMLSelectElement;
  facadePresetSelect: HTMLSelectElement;
  wallWidthInput: HTMLInputElement;
  wallWidthValue: HTMLElement;
  floorsInput: HTMLInputElement;
  floorsValue: HTMLElement;
  floorHeightInput: HTMLInputElement;
  floorHeightValue: HTMLElement;
  previewDepthInput: HTMLInputElement;
  previewDepthValue: HTMLElement;
  totalHeightValue: HTMLElement;
  facadeEditor: HTMLTextAreaElement;
  previewStatus: HTMLElement;
  elevationPreview: SVGSVGElement;
  summaryPanel: HTMLElement;
  componentLibrary: HTMLElement;
  exportViewSelect: HTMLSelectElement;
  exportOutput: HTMLTextAreaElement;
  stageMount: HTMLElement;
  loadPresetButton: HTMLButtonElement;
  applyFacadeButton: HTMLButtonElement;
  downloadSvgButton: HTMLButtonElement;
  downloadSnapshotButton: HTMLButtonElement;
  downloadReportButton: HTMLButtonElement;
  focusPreviewButton: HTMLButtonElement;
}

export function getWorkbenchElements(): WorkbenchElements {
  return {
    facadeSideSelect: getRequiredElement("#facadeSide"),
    facadePresetSelect: getRequiredElement("#facadePreset"),
    wallWidthInput: getRequiredElement("#wallWidth"),
    wallWidthValue: getRequiredElement("#wallWidthValue"),
    floorsInput: getRequiredElement("#floors"),
    floorsValue: getRequiredElement("#floorsValue"),
    floorHeightInput: getRequiredElement("#floorHeight"),
    floorHeightValue: getRequiredElement("#floorHeightValue"),
    previewDepthInput: getRequiredElement("#previewDepth"),
    previewDepthValue: getRequiredElement("#previewDepthValue"),
    totalHeightValue: getRequiredElement("#totalHeightValue"),
    facadeEditor: getRequiredElement("#facadeEditor"),
    previewStatus: getRequiredElement("#previewStatus"),
    elevationPreview: getRequiredElement("#elevationPreview"),
    summaryPanel: getRequiredElement("#summaryPanel"),
    componentLibrary: getRequiredElement("#componentLibrary"),
    exportViewSelect: getRequiredElement("#exportView"),
    exportOutput: getRequiredElement("#exportOutput"),
    stageMount: getRequiredElement("#stageMount"),
    loadPresetButton: getRequiredElement("#loadPreset"),
    applyFacadeButton: getRequiredElement("#applyFacade"),
    downloadSvgButton: getRequiredElement("#downloadSvg"),
    downloadSnapshotButton: getRequiredElement("#downloadSnapshot"),
    downloadReportButton: getRequiredElement("#downloadReport"),
    focusPreviewButton: getRequiredElement("#focusPreview"),
  };
}
