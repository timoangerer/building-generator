import type {
  ElementCatalogConfig,
  ElementCatalog,
  GeometryPart,
  ColorPalette,
  ElementDefinition,
  Vec3,
} from "@/contracts";

// --- Part builders (task 2.1) ---

function pos(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

function boxPart(
  role: string,
  width: number,
  height: number,
  depth: number,
  position: Vec3 = pos(0, 0, 0),
): GeometryPart {
  return { shape: "box", dimensions: { width, height, depth }, role, position };
}

function cylinderPart(
  role: string,
  radius: number,
  height: number,
  position: Vec3 = pos(0, 0, 0),
): GeometryPart {
  return { shape: "cylinder", dimensions: { radius, height }, role, position };
}

function halfCylinderPart(
  role: string,
  radius: number,
  depth: number,
  position: Vec3 = pos(0, 0, 0),
): GeometryPart {
  return { shape: "half_cylinder", dimensions: { radius, depth }, role, position };
}

// --- Element definitions (tasks 2.2–2.4) ---

function buildWindowTall(): ElementDefinition {
  // Narrow rectangular window ~0.6w × 1.3h
  return {
    elementId: "window-tall",
    type: "window",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 0.6, 1.3, 0.08),
        boxPart("pane", 0.5, 1.2, 0.03, pos(0, 0, 0.04)),
        boxPart("sill", 0.7, 0.06, 0.12, pos(0, -0.65, 0.06)),
      ],
    },
  };
}

function buildWindowArched(): ElementDefinition {
  // Tall window with semicircular arch top
  const paneW = 0.5;
  const rectH = 1.0;
  const archR = paneW / 2;
  return {
    elementId: "window-arched",
    type: "window",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 0.6, rectH, 0.08),
        boxPart("pane", paneW, rectH, 0.03, pos(0, 0, 0.04)),
        halfCylinderPart("arch", archR, 0.03, pos(0, rectH / 2, 0.06)),
        boxPart("sill", 0.7, 0.06, 0.12, pos(0, -rectH / 2, 0.06)),
      ],
    },
  };
}

function buildWindowShuttered(): ElementDefinition {
  // Tall window with flanking shutters and sill
  const paneW = 0.5;
  const paneH = 1.2;
  const shutterW = 0.15;
  return {
    elementId: "window-shuttered",
    type: "window",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 0.6, paneH, 0.08),
        boxPart("pane", paneW, paneH, 0.03, pos(0, 0, 0.04)),
        boxPart("shutter", shutterW, paneH, 0.04, pos(-(paneW / 2 + shutterW / 2 + 0.02), 0, 0.04)),
        boxPart("shutter", shutterW, paneH, 0.04, pos(paneW / 2 + shutterW / 2 + 0.02, 0, 0.04)),
        boxPart("sill", 0.8, 0.06, 0.12, pos(0, -paneH / 2, 0.06)),
      ],
    },
  };
}

function buildWindowArchShut(): ElementDefinition {
  // Arched window with shutters and sill
  const paneW = 0.5;
  const rectH = 1.0;
  const archR = paneW / 2;
  const shutterW = 0.15;
  return {
    elementId: "window-arch-shut",
    type: "window",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 0.6, rectH, 0.08),
        boxPart("pane", paneW, rectH, 0.03, pos(0, 0, 0.04)),
        halfCylinderPart("arch", archR, 0.03, pos(0, rectH / 2, 0.06)),
        boxPart("shutter", shutterW, rectH, 0.04, pos(-(paneW / 2 + shutterW / 2 + 0.02), 0, 0.04)),
        boxPart("shutter", shutterW, rectH, 0.04, pos(paneW / 2 + shutterW / 2 + 0.02, 0, 0.04)),
        boxPart("sill", 0.8, 0.06, 0.12, pos(0, -rectH / 2, 0.06)),
      ],
    },
  };
}

function buildWindowSmallSq(): ElementDefinition {
  // Small square window ~0.5w × 0.5h
  return {
    elementId: "window-small-sq",
    type: "window",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 0.5, 0.5, 0.08),
        boxPart("pane", 0.4, 0.4, 0.03, pos(0, 0, 0.04)),
        boxPart("sill", 0.6, 0.05, 0.1, pos(0, -0.25, 0.06)),
      ],
    },
  };
}

function buildDoorArched(): ElementDefinition {
  // Wide arched entry door
  const panelW = 0.9;
  const rectH = 2.0;
  const archR = panelW / 2;
  return {
    elementId: "door-arched",
    type: "door",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 1.0, rectH, 0.1),
        boxPart("panel", panelW, rectH, 0.05, pos(0, 0, 0.05)),
        halfCylinderPart("arch", archR, 0.05, pos(0, rectH / 2, 0.08)),
      ],
    },
  };
}

function buildDoorPaneled(): ElementDefinition {
  // Simple paneled door with frame
  return {
    elementId: "door-paneled",
    type: "door",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", 1.0, 2.2, 0.1),
        boxPart("panel", 0.85, 2.1, 0.05, pos(0, 0, 0.05)),
      ],
    },
  };
}

function buildBalconyDoorIron(): ElementDefinition {
  // French door + thin slab + iron railing
  const doorW = 0.9;
  const doorH = 2.2;
  const slabW = 1.2;
  const slabDepth = 0.6;
  const slabThick = 0.08;
  const railH = 0.9;
  const railThick = 0.03;
  return {
    elementId: "balcony-door-iron",
    type: "door",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", doorW + 0.1, doorH, 0.1),
        boxPart("pane", doorW / 2 - 0.02, doorH - 0.1, 0.03, pos(-doorW / 4, 0, 0.05)),
        boxPart("pane", doorW / 2 - 0.02, doorH - 0.1, 0.03, pos(doorW / 4, 0, 0.05)),
        // Balcony slab
        boxPart("slab", slabW, slabThick, slabDepth, pos(0, -doorH / 2, slabDepth / 2)),
        // Iron railing — front
        boxPart("railing", slabW, railH, railThick, pos(0, -doorH / 2 + railH / 2, slabDepth)),
        // Iron railing — left
        boxPart("railing", railThick, railH, slabDepth, pos(-slabW / 2, -doorH / 2 + railH / 2, slabDepth / 2)),
        // Iron railing — right
        boxPart("railing", railThick, railH, slabDepth, pos(slabW / 2, -doorH / 2 + railH / 2, slabDepth / 2)),
      ],
    },
  };
}

function buildBalconyDoorStone(): ElementDefinition {
  // French door + thick slab + stone balustrade
  const doorW = 0.9;
  const doorH = 2.2;
  const slabW = 1.4;
  const slabDepth = 0.8;
  const slabThick = 0.12;
  const balH = 0.8;
  const balThick = 0.1;
  return {
    elementId: "balcony-door-stone",
    type: "door",
    geometry: {
      type: "composite",
      parts: [
        boxPart("frame", doorW + 0.1, doorH, 0.1),
        boxPart("pane", doorW / 2 - 0.02, doorH - 0.1, 0.03, pos(-doorW / 4, 0, 0.05)),
        boxPart("pane", doorW / 2 - 0.02, doorH - 0.1, 0.03, pos(doorW / 4, 0, 0.05)),
        // Thick stone slab
        boxPart("slab", slabW, slabThick, slabDepth, pos(0, -doorH / 2, slabDepth / 2)),
        // Stone balustrade — front
        boxPart("railing", slabW, balH, balThick, pos(0, -doorH / 2 + balH / 2, slabDepth)),
        // Stone balustrade — left
        boxPart("railing", balThick, balH, slabDepth, pos(-slabW / 2, -doorH / 2 + balH / 2, slabDepth / 2)),
        // Stone balustrade — right
        boxPart("railing", balThick, balH, slabDepth, pos(slabW / 2, -doorH / 2 + balH / 2, slabDepth / 2)),
      ],
    },
  };
}

// --- Default palette (task 2.5) ---

const defaultMediterraneanPalette: ColorPalette = {
  pane: 0x1a2030,     // dark blue-grey glass
  frame: 0xc8b898,    // warm sandstone
  shutter: 0x4a6741,  // muted sage green
  sill: 0xd4c8b0,     // light stone
  panel: 0x6b4a32,    // warm wood brown
  railing: 0x2a2a2a,  // dark iron
  slab: 0xb8a890,     // light stone/concrete
  arch: 0xc8b898,     // sandstone (matches frame)
};

// --- Generator (task 2.6) ---

export function generateElementCatalog(
  config: ElementCatalogConfig,
): ElementCatalog {
  return {
    config,
    elements: [
      buildWindowTall(),
      buildWindowArched(),
      buildWindowShuttered(),
      buildWindowArchShut(),
      buildWindowSmallSq(),
      buildDoorArched(),
      buildDoorPaneled(),
      buildBalconyDoorIron(),
      buildBalconyDoorStone(),
    ],
    defaultPalette: defaultMediterraneanPalette,
  };
}
