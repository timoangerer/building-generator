import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const plotTypes = ["square", "rectangle", "l-shape", "h-shape", "o-shape", "courtyard"];
const facadeSides = ["north", "east", "south", "west", "inner"];
const facadePresets = {
  classical: {
    name: "Classical",
    zones: [
      {
        key: "ground",
        height: 4.4,
        inset: 0.18,
        rows: [
          {
            height: 1,
            items: [
              {
                type: "door",
                widthRatio: 1.2,
                minWidth: 1.8,
                maxWidth: 2.4,
                frameDepth: 0.3,
                arch: true,
              },
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.5,
                maxWidth: 2.1,
                gap: 0.65,
                frameDepth: 0.18,
                sill: true,
                header: "pediment",
              },
            ],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.32, offsetY: 4.25 }],
      },
      {
        key: "middle",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            floorCount: "auto",
            heightPerFloor: 3.25,
            items: [
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.4,
                maxWidth: 1.95,
                gap: 0.65,
                sill: true,
                header: "lintel",
              },
            ],
          },
        ],
      },
      {
        key: "top",
        height: 2.6,
        rows: [
          {
            height: 1,
            verticalAlign: "center",
            items: [
              {
                type: "oculus",
                repeatFit: true,
                minWidth: 1.2,
                maxWidth: 1.5,
                gap: 1.3,
              },
            ],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.42, offsetY: 0.15 }],
      },
    ],
  },
  modern: {
    name: "Modern",
    zones: [
      {
        key: "base",
        height: 4.2,
        inset: 0.26,
        rows: [
          {
            height: 1,
            items: [
              {
                type: "entry",
                widthRatio: 1.4,
                minWidth: 2,
                maxWidth: 2.8,
                frameDepth: 0.22,
              },
              {
                type: "glass",
                repeatFit: true,
                minWidth: 1.8,
                maxWidth: 2.4,
                gap: 0.35,
                frameDepth: 0.12,
              },
            ],
          },
        ],
      },
      {
        key: "stack",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            heightPerFloor: 3.35,
            items: [
              {
                type: "glass",
                repeatFit: true,
                minWidth: 1.9,
                maxWidth: 2.6,
                gap: 0.35,
                balcony: {
                  every: 2,
                  depth: 0.95,
                  railHeight: 1.05,
                },
              },
            ],
          },
        ],
      },
      {
        key: "crown",
        height: 2.1,
        rows: [
          {
            height: 1,
            items: [{ type: "screen", repeatFit: true, minWidth: 1.2, maxWidth: 1.8, gap: 0.2 }],
          },
        ],
      },
    ],
  },
  ornate: {
    name: "Ornate",
    zones: [
      {
        key: "base",
        height: 4.8,
        inset: 0.2,
        rows: [
          {
            height: 1,
            items: [
              { type: "door", widthRatio: 1.3, minWidth: 2, maxWidth: 2.6, arch: true, frameDepth: 0.28 },
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.4,
                maxWidth: 2.1,
                gap: 0.55,
                frameDepth: 0.18,
                sill: true,
                header: "arch",
              },
            ],
          },
        ],
        ornaments: [
          { type: "cornice", size: 0.36, offsetY: 4.55 },
          { type: "band", size: 0.2, offsetY: 3.1 },
        ],
      },
      {
        key: "residential",
        flex: 1,
        rows: [
          {
            repeatFloors: true,
            heightPerFloor: 3.15,
            items: [
              {
                type: "window",
                repeatFit: true,
                minWidth: 1.35,
                maxWidth: 1.8,
                gap: 0.55,
                sill: true,
                header: "pediment",
                balcony: {
                  every: 3,
                  depth: 0.88,
                  railHeight: 1.0,
                },
              },
            ],
          },
        ],
      },
      {
        key: "attic",
        height: 2.8,
        rows: [
          {
            height: 1,
            items: [{ type: "oculus", repeatFit: true, minWidth: 1.0, maxWidth: 1.25, gap: 1.2 }],
          },
        ],
        ornaments: [{ type: "cornice", size: 0.45, offsetY: 0.15 }],
      },
    ],
  },
};

const defaultFacadeMap = {
  north: structuredClone(facadePresets.classical),
  east: structuredClone(facadePresets.modern),
  south: structuredClone(facadePresets.ornate),
  west: structuredClone(facadePresets.classical),
  inner: structuredClone(facadePresets.modern),
};

const mount = document.querySelector("#sceneMount");
const selectionInfo = document.querySelector("#selectionInfo");
const plotTypeSelect = document.querySelector("#plotType");
const floorsInput = document.querySelector("#floors");
const floorsValue = document.querySelector("#floorsValue");
const floorHeightInput = document.querySelector("#floorHeight");
const floorHeightValue = document.querySelector("#floorHeightValue");
const seedInput = document.querySelector("#seed");
const facadeSideSelect = document.querySelector("#facadeSide");
const facadePresetSelect = document.querySelector("#facadePreset");
const facadeEditor = document.querySelector("#facadeEditor");
const viewportShell = document.querySelector("#viewportShell");
const toggleFocusButton = document.querySelector("#toggleFocus");
const facadeFocus = document.querySelector("#facadeFocus");
const focusTitle = document.querySelector("#focusTitle");
const focusSubtitle = document.querySelector("#focusSubtitle");
const previewStatus = document.querySelector("#previewStatus");
const elevationPreview = document.querySelector("#elevationPreview");
const componentLibrary = document.querySelector("#componentLibrary");
const alignFocusViewButton = document.querySelector("#alignFocusView");
const closeFocusButton = document.querySelector("#closeFocus");

for (const type of plotTypes) {
  const option = document.createElement("option");
  option.value = type;
  option.textContent = type;
  plotTypeSelect.append(option);
}
plotTypeSelect.value = "rectangle";

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

const state = {
  plotType: plotTypeSelect.value,
  floors: Number(floorsInput.value),
  floorHeight: Number(floorHeightInput.value),
  seed: Number(seedInput.value),
  facades: structuredClone(defaultFacadeMap),
  selectedSide: facadeSideSelect.value,
  selectedSegment: null,
  focusMode: false,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#e5ddca");
scene.fog = new THREE.Fog("#e5ddca", 70, 160);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
camera.position.set(24, 22, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
mount.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 6, 0);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const stage = new THREE.Group();
scene.add(stage);

const ambient = new THREE.HemisphereLight("#fff4dc", "#9a876f", 1.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight("#fff7e9", 1.65);
sun.position.set(28, 32, 16);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(68, 72),
  new THREE.MeshStandardMaterial({ color: "#c8b999", roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(90, 30, "#a17d54", "#baaa92");
grid.position.y = 0.02;
scene.add(grid);

const materials = {
  mass: new THREE.MeshStandardMaterial({ color: "#d9cdbb", roughness: 0.94, metalness: 0.02 }),
  wall: new THREE.MeshStandardMaterial({ color: "#efe7d8", roughness: 0.88 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#8fb0bf",
    roughness: 0.14,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
  }),
  trim: new THREE.MeshStandardMaterial({ color: "#c5b097", roughness: 0.74 }),
  dark: new THREE.MeshStandardMaterial({ color: "#5c5349", roughness: 0.92 }),
  balcony: new THREE.MeshStandardMaterial({ color: "#8a8d92", roughness: 0.55, metalness: 0.28 }),
  highlight: new THREE.MeshStandardMaterial({ color: "#f5c261", roughness: 0.55, emissive: "#866125" }),
};

let wallPickers = [];
const svgNs = "http://www.w3.org/2000/svg";

function createRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function choose(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function cloneSelectionSignature(segment) {
  if (!segment) return null;
  return {
    side: segment.side,
    isHole: segment.isHole,
    length: segment.length,
    center: segment.center.clone(),
  };
}

function findMatchingSegment(wallSegments, selection) {
  if (!selection) return null;
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const segment of wallSegments) {
    if (segment.side !== selection.side || segment.isHole !== selection.isHole) continue;
    const centerDelta = segment.center.distanceTo(selection.center);
    const score = centerDelta * 1.5 + Math.abs(segment.length - selection.length);
    if (score < bestScore) {
      best = segment;
      bestScore = score;
    }
  }

  return best;
}

function resize() {
  const { clientWidth, clientHeight } = mount;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  if (state.focusMode && state.selectedSegment) {
    alignCameraToSelectedSegment();
  }
}

window.addEventListener("resize", resize);

function cellKey(x, y) {
  return `${x},${y}`;
}

function rectCells(x0, y0, width, height) {
  const cells = [];
  for (let x = x0; x < x0 + width; x += 1) {
    for (let y = y0; y < y0 + height; y += 1) {
      cells.push([x, y]);
    }
  }
  return cells;
}

function buildFootprintCells(type, rng) {
  const shapes = {
    square: () => rectCells(0, 0, randomInt(rng, 4, 6), randomInt(rng, 4, 6)),
    rectangle: () => rectCells(0, 0, randomInt(rng, 5, 8), randomInt(rng, 3, 5)),
    "l-shape": () => {
      const w = randomInt(rng, 5, 7);
      const h = randomInt(rng, 5, 7);
      const arm = randomInt(rng, 2, 3);
      return [...rectCells(0, 0, w, arm), ...rectCells(0, arm, arm, h - arm)];
    },
    "h-shape": () => {
      const w = 7;
      const h = randomInt(rng, 6, 8);
      const leg = randomInt(rng, 2, 3);
      return [
        ...rectCells(0, 0, leg, h),
        ...rectCells(w - leg, 0, leg, h),
        ...rectCells(leg, Math.floor(h / 2) - 1, w - leg * 2, 2),
      ];
    },
    "o-shape": () => {
      const w = randomInt(rng, 6, 8);
      const h = randomInt(rng, 6, 8);
      const ring = [];
      ring.push(...rectCells(0, 0, w, 1));
      ring.push(...rectCells(0, h - 1, w, 1));
      ring.push(...rectCells(0, 1, 1, h - 2));
      ring.push(...rectCells(w - 1, 1, 1, h - 2));
      return ring;
    },
    courtyard: () => {
      const w = randomInt(rng, 7, 9);
      const h = randomInt(rng, 6, 8);
      const cells = rectCells(0, 0, w, h);
      const holeW = Math.max(2, w - 4);
      const holeH = Math.max(2, h - 4);
      const holeX = Math.floor((w - holeW) / 2);
      const holeY = Math.floor((h - holeH) / 2);
      const hole = new Set(rectCells(holeX, holeY, holeW, holeH).map(([x, y]) => cellKey(x, y)));
      return cells.filter(([x, y]) => !hole.has(cellKey(x, y)));
    },
  };

  const deduped = new Map();
  for (const [x, y] of shapes[type]()) deduped.set(cellKey(x, y), [x, y]);
  return [...deduped.values()];
}

function extractLoops(cells) {
  const cellSet = new Set(cells.map(([x, y]) => cellKey(x, y)));
  const segments = [];
  const neighbors = [
    [0, -1, ([x, y]) => [[x, y], [x + 1, y]]],
    [1, 0, ([x, y]) => [[x + 1, y], [x + 1, y + 1]]],
    [0, 1, ([x, y]) => [[x + 1, y + 1], [x, y + 1]]],
    [-1, 0, ([x, y]) => [[x, y + 1], [x, y]]],
  ];

  for (const [x, y] of cells) {
    for (const [dx, dy, makeSegment] of neighbors) {
      if (!cellSet.has(cellKey(x + dx, y + dy))) {
        const [a, b] = makeSegment([x, y]);
        segments.push({ a, b });
      }
    }
  }

  const outgoing = new Map();
  for (const segment of segments) {
    const key = cellKey(segment.a[0], segment.a[1]);
    if (!outgoing.has(key)) outgoing.set(key, []);
    outgoing.get(key).push(segment);
  }

  const visited = new Set();
  const loops = [];
  for (const segment of segments) {
    const startKey = `${segment.a[0]},${segment.a[1]}->${segment.b[0]},${segment.b[1]}`;
    if (visited.has(startKey)) continue;
    const loop = [];
    let current = segment;
    while (current) {
      const currentKey = `${current.a[0]},${current.a[1]}->${current.b[0]},${current.b[1]}`;
      if (visited.has(currentKey)) break;
      visited.add(currentKey);
      loop.push(current.a);
      const nextKey = cellKey(current.b[0], current.b[1]);
      const nextSegments = outgoing.get(nextKey) || [];
      current = nextSegments.find((candidate) => {
        const candidateKey = `${candidate.a[0]},${candidate.a[1]}->${candidate.b[0]},${candidate.b[1]}`;
        return !visited.has(candidateKey);
      });
      if (current && current.a[0] === segment.a[0] && current.a[1] === segment.a[1]) {
        break;
      }
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function normalizeLoops(loops) {
  const sorted = [...loops].sort((a, b) => Math.abs(polygonArea(b)) - Math.abs(polygonArea(a)));
  const outer = [];
  const holes = [];
  for (const loop of sorted) {
    if (polygonArea(loop) > 0) {
      outer.push(loop);
    } else {
      holes.push([...loop].reverse());
    }
  }
  if (!outer.length && holes.length) {
    outer.push(holes.shift());
  }
  return { outer, holes };
}

function classifySide(dx, dz, isHole) {
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? (isHole ? "west" : "north") : isHole ? "east" : "south";
  }
  return dz > 0 ? (isHole ? "south" : "east") : isHole ? "north" : "west";
}

function generateFootprint(type, rng) {
  const cells = buildFootprintCells(type, rng);
  const loops = extractLoops(cells);
  const { outer, holes } = normalizeLoops(loops);

  const allPoints = cells.flatMap(([x, y]) => [[x, y], [x + 1, y + 1]]);
  const minX = Math.min(...allPoints.map(([x]) => x));
  const maxX = Math.max(...allPoints.map(([x]) => x));
  const minY = Math.min(...allPoints.map(([, y]) => y));
  const maxY = Math.max(...allPoints.map(([, y]) => y));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const scale = 3;

  const translateLoop = (loop) =>
    loop.map(([x, y]) => new THREE.Vector2((x - centerX) * scale, (y - centerY) * scale));

  const outerLoops = outer.map(translateLoop);
  const holeLoops = holes.map(translateLoop);

  const shape = new THREE.Shape(outerLoops[0]);
  for (const loop of holeLoops) {
    shape.holes.push(new THREE.Path(loop));
  }

  const wallSegments = [];
  for (const loop of outerLoops) {
    for (let i = 0; i < loop.length; i += 1) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const midX = (a.x + b.x) / 2;
      const midZ = (a.y + b.y) / 2;
      const tangent = new THREE.Vector3(b.x - a.x, 0, b.y - a.y);
      const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
      wallSegments.push({
        a: new THREE.Vector3(a.x, 0, a.y),
        b: new THREE.Vector3(b.x, 0, b.y),
        center: new THREE.Vector3(midX, 0, midZ),
        tangent,
        normal,
        length: tangent.length(),
        side: classifySide(normal.x, normal.z, false),
        isHole: false,
      });
    }
  }

  for (const loop of holeLoops) {
    for (let i = 0; i < loop.length; i += 1) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const midX = (a.x + b.x) / 2;
      const midZ = (a.y + b.y) / 2;
      const tangent = new THREE.Vector3(b.x - a.x, 0, b.y - a.y);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      wallSegments.push({
        a: new THREE.Vector3(a.x, 0, a.y),
        b: new THREE.Vector3(b.x, 0, b.y),
        center: new THREE.Vector3(midX, 0, midZ),
        tangent,
        normal,
        length: tangent.length(),
        side: "inner",
        isHole: true,
      });
    }
  }

  return { shape, wallSegments };
}

function allocateZoneHeights(totalHeight, facade) {
  const fixed = facade.zones.reduce((sum, zone) => sum + (zone.height || 0), 0);
  const flexZones = facade.zones.filter((zone) => zone.flex);
  const remaining = Math.max(0.1, totalHeight - fixed);
  const flexUnits = flexZones.reduce((sum, zone) => sum + zone.flex, 0) || 1;

  return facade.zones.map((zone) => ({
    ...zone,
    resolvedHeight: zone.height || (remaining * zone.flex) / flexUnits,
  }));
}

function planRows(zone, width, height, floorHeight) {
  const rows = [];
  let cursorY = 0;
  for (const row of zone.rows || []) {
    if (row.repeatFloors) {
      const repeatCount = Math.max(1, Math.floor(height / (row.heightPerFloor || floorHeight)));
      const resolvedHeight = height / repeatCount;
      for (let i = 0; i < repeatCount; i += 1) {
        rows.push({
          ...row,
          resolvedHeight,
          y: cursorY + i * resolvedHeight,
          floorIndex: i,
        });
      }
      cursorY += height;
    } else {
      const rowHeight = (row.height || 1) * height;
      rows.push({ ...row, resolvedHeight: rowHeight, y: cursorY, floorIndex: 0 });
      cursorY += rowHeight;
    }
  }
  return rows.map((row) => ({ ...row, width }));
}

function fitRepeatItem(item, availableWidth) {
  const minWidth = item.minWidth || 1.2;
  const maxWidth = item.maxWidth || availableWidth;
  const gap = item.gap || 0.4;
  const count = Math.max(1, Math.floor((availableWidth + gap) / (minWidth + gap)));
  const totalGap = gap * Math.max(0, count - 1);
  const width = Math.min(maxWidth, (availableWidth - totalGap) / count);
  return Array.from({ length: count }, () => ({ ...item, resolvedWidth: width }));
}

function buildRowLayout(row, width) {
  const sourceItems = row.items || [];
  const fixedItems = sourceItems.filter((item) => !item.repeatFit);
  const repeatGroups = sourceItems.filter((item) => item.repeatFit);

  const prepared = fixedItems.map((item) => ({
    ...item,
    resolvedWidth: THREE.MathUtils.clamp(
      item.width || item.widthRatio || 1.5,
      item.minWidth || 1,
      item.maxWidth || width
    ),
  }));

  const fixedWidth = prepared.reduce((sum, item) => sum + item.resolvedWidth, 0);
  const fixedGap = prepared.reduce((sum, item, index) => sum + (index < prepared.length - 1 ? item.gap ?? 0.5 : 0), 0);
  const repeatWeight = repeatGroups.reduce((sum, item) => sum + (item.widthRatio || 1), 0) || 1;
  const remainingWidth = Math.max(width * 0.25, width - fixedWidth - fixedGap - repeatGroups.length * 0.35);

  for (const item of repeatGroups) {
    const slotWidth = (remainingWidth * (item.widthRatio || 1)) / repeatWeight;
    prepared.push(...fitRepeatItem(item, slotWidth));
  }

  const gap = prepared.reduce((sum, item, index) => sum + (index < prepared.length - 1 ? item.gap ?? 0.5 : 0), 0);
  const totalWidth = prepared.reduce((sum, item) => sum + item.resolvedWidth, 0);
  const scale = totalWidth + gap > width ? width / (totalWidth + gap) : 1;
  const result = [];
  let cursor = -(width / 2) + (width - (totalWidth + gap) * scale) / 2;

  for (let i = 0; i < prepared.length; i += 1) {
    const item = prepared[i];
    const resolvedWidth = item.resolvedWidth * scale;
    result.push({
      ...item,
      x: cursor + resolvedWidth / 2,
      width: resolvedWidth,
    });
    cursor += resolvedWidth + (item.gap ?? 0.5) * scale;
  }
  return result;
}

function makeBox(width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addHeader(group, type, width, y, depth) {
  if (!type) return;
  if (type === "lintel") {
    const lintel = makeBox(width * 1.1, 0.16, 0.12, materials.trim);
    lintel.position.set(0, y, depth);
    group.add(lintel);
  } else if (type === "pediment") {
    const pediment = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.42, 0.34, 3),
      materials.trim
    );
    pediment.rotation.z = Math.PI / 2;
    pediment.position.set(0, y + 0.12, depth);
    pediment.castShadow = true;
    group.add(pediment);
  } else if (type === "arch") {
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(width * 0.24, 0.06, 10, 24, Math.PI),
      materials.trim
    );
    arch.rotation.z = Math.PI;
    arch.position.set(0, y, depth);
    arch.castShadow = true;
    group.add(arch);
  }
}

function buildFacadeElement(item, rowHeight, floorIndex) {
  const group = new THREE.Group();
  const width = item.width;
  const height = Math.min(rowHeight * 0.74, item.type === "door" || item.type === "entry" ? rowHeight * 0.9 : rowHeight * 0.68);
  const baseDepth = item.frameDepth || 0.12;
  const frame = makeBox(width, height, baseDepth, materials.trim);
  frame.position.z = 0.03;

  if (item.type === "window" || item.type === "glass") {
    const pane = makeBox(width * 0.76, height * 0.78, 0.06, materials.glass);
    group.add(frame, pane);
    if (item.sill) {
      const sill = makeBox(width * 0.84, 0.12, 0.18, materials.trim);
      sill.position.set(0, -height * 0.44, 0.08);
      group.add(sill);
    }
    addHeader(group, item.header, width, height * 0.54, 0.05);
  } else if (item.type === "door" || item.type === "entry") {
    const doorLeaf = makeBox(width * 0.72, height * 0.88, 0.08, materials.dark);
    doorLeaf.position.z = 0.02;
    group.add(frame, doorLeaf);
    if (item.arch) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(width * 0.26, 0.08, 12, 28, Math.PI),
        materials.trim
      );
      arch.rotation.z = Math.PI;
      arch.position.set(0, height * 0.5, 0.08);
      arch.castShadow = true;
      group.add(arch);
    }
  } else if (item.type === "balcony") {
    const slab = makeBox(width, 0.18, item.depth || 0.9, materials.balcony);
    slab.position.z = (item.depth || 0.9) / 2;
    slab.position.y = -height * 0.48;
    group.add(slab);
  } else if (item.type === "oculus") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(width * 0.25, 0.08, 14, 26), materials.trim);
    const pane = new THREE.Mesh(new THREE.CircleGeometry(width * 0.2, 28), materials.glass);
    pane.position.z = 0.04;
    ring.castShadow = true;
    group.add(ring, pane);
  } else if (item.type === "screen") {
    const panel = makeBox(width * 0.9, height * 0.72, 0.1, materials.trim);
    const slat = makeBox(0.08, height * 0.72, 0.14, materials.dark);
    for (let i = -2; i <= 2; i += 1) {
      const clone = slat.clone();
      clone.position.x = i * (width * 0.16);
      group.add(clone);
    }
    group.add(panel);
  }

  if (item.balcony && floorIndex % item.balcony.every === 0) {
    const slab = makeBox(width * 0.92, 0.16, item.balcony.depth, materials.balcony);
    slab.position.set(0, -height * 0.62, item.balcony.depth / 2 - 0.02);
    group.add(slab);

    const rail = makeBox(width * 0.9, item.balcony.railHeight, 0.06, materials.dark);
    rail.position.set(0, -height * 0.18, item.balcony.depth - 0.04);
    group.add(rail);

    const sideRail = makeBox(0.05, item.balcony.railHeight, item.balcony.depth, materials.dark);
    const left = sideRail.clone();
    const right = sideRail.clone();
    left.position.set(-width * 0.45, -height * 0.18, item.balcony.depth / 2);
    right.position.set(width * 0.45, -height * 0.18, item.balcony.depth / 2);
    group.add(left, right);
  }

  return group;
}

function buildOrnament(type, length, size, offsetY) {
  if (type === "cornice") {
    const cornice = makeBox(length, size, 0.28, materials.trim);
    cornice.position.set(0, offsetY, 0.06);
    return cornice;
  }
  if (type === "band") {
    const band = makeBox(length, size, 0.14, materials.trim);
    band.position.set(0, offsetY, 0.04);
    return band;
  }
  return null;
}

function buildFacadeForSegment(segment, totalHeight, facade, floorHeight) {
  const group = new THREE.Group();
  const zones = allocateZoneHeights(totalHeight, facade);
  let cursorY = 0;

  const wallPlane = makeBox(segment.length, totalHeight, 0.24, materials.wall);
  wallPlane.position.set(0, totalHeight / 2, -0.12);
  group.add(wallPlane);

  for (const zone of zones) {
    const zoneGroup = new THREE.Group();
    const rows = planRows(zone, Math.max(1.6, segment.length - 0.6 - (zone.inset || 0) * 2), zone.resolvedHeight, floorHeight);
    zoneGroup.position.z = zone.inset || 0;
    for (const row of rows) {
      const rowLayout = buildRowLayout(row, row.width);
      for (const item of rowLayout) {
        const element = buildFacadeElement(item, row.resolvedHeight, row.floorIndex);
        element.position.set(item.x, cursorY + row.y + row.resolvedHeight / 2, 0.14);
        zoneGroup.add(element);
      }
    }
    for (const ornament of zone.ornaments || []) {
      const node = buildOrnament(ornament.type, segment.length, ornament.size, cursorY + ornament.offsetY);
      if (node) zoneGroup.add(node);
    }
    group.add(zoneGroup);
    cursorY += zone.resolvedHeight;
  }

  return group;
}

function orientObjectToSegment(object, segment) {
  const outward = segment.normal.clone().normalize();
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);
}

function createSvgNode(tag, attributes = {}) {
  const node = document.createElementNS(svgNs, tag);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function createFacadePreviewData(segment, totalHeight, facade, floorHeight) {
  const previewZones = [];
  const components = new Map();
  let cursorY = 0;

  const registerComponent = (type, zoneKey) => {
    const key = type || "unknown";
    if (!components.has(key)) {
      components.set(key, { type: key, count: 0, zones: new Set() });
    }
    const entry = components.get(key);
    entry.count += 1;
    if (zoneKey) entry.zones.add(zoneKey);
  };

  for (const zone of allocateZoneHeights(totalHeight, facade)) {
    const contentWidth = Math.max(1.6, segment.length - 0.6 - (zone.inset || 0) * 2);
    const rows = planRows(zone, contentWidth, zone.resolvedHeight, floorHeight).map((row) => {
      const items = buildRowLayout(row, row.width).map((item) => {
        registerComponent(item.type, zone.key);
        if (item.balcony && row.floorIndex % item.balcony.every === 0) {
          registerComponent("balcony", zone.key);
        }
        return item;
      });

      return {
        ...row,
        absoluteY: cursorY + row.y,
        items,
      };
    });

    previewZones.push({
      key: zone.key,
      inset: zone.inset || 0,
      y: cursorY,
      height: zone.resolvedHeight,
      contentWidth,
      rows,
      ornaments: zone.ornaments || [],
    });

    cursorY += zone.resolvedHeight;
  }

  return {
    totalHeight,
    segmentLength: segment.length,
    zones: previewZones,
    components: [...components.values()].sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };
}

function renderElevationPreview(previewData) {
  elevationPreview.replaceChildren();

  if (!previewData) {
    const placeholder = createSvgNode("text", {
      x: 500,
      y: 360,
      "text-anchor": "middle",
      "font-size": 28,
      "font-family": "Avenir Next, Segoe UI, sans-serif",
      fill: "#6a5c4f",
    });
    placeholder.textContent = "Select a wall to preview its elevation";
    elevationPreview.append(placeholder);
    return;
  }

  const viewWidth = 1000;
  const viewHeight = 720;
  const padX = 78;
  const padY = 42;
  const wallWidth = viewWidth - padX * 2;
  const wallHeight = viewHeight - padY * 2;
  const scaleX = wallWidth / previewData.segmentLength;
  const scaleY = wallHeight / previewData.totalHeight;
  const centerX = viewWidth / 2;
  const wallBottom = viewHeight - padY;
  const wallLeft = centerX - wallWidth / 2;
  const wallTop = padY;
  const toX = (value) => centerX + value * scaleX;
  const toY = (value) => wallBottom - value * scaleY;
  const baseRect = createSvgNode("rect", {
    x: wallLeft,
    y: wallTop,
    width: wallWidth,
    height: wallHeight,
    rx: 26,
    fill: "#efe7d8",
    stroke: "rgba(80, 61, 41, 0.24)",
    "stroke-width": 2,
  });
  elevationPreview.append(baseRect);

  for (let i = 0; i < previewData.zones.length; i += 1) {
    const zone = previewData.zones[i];
    const zoneTop = toY(zone.y + zone.height);
    const zoneBottom = toY(zone.y);
    const contentX = toX(-zone.contentWidth / 2);
    const overlay = createSvgNode("rect", {
      x: contentX,
      y: zoneTop,
      width: zone.contentWidth * scaleX,
      height: zoneBottom - zoneTop,
      fill: i % 2 === 0 ? "rgba(255,255,255,0.18)" : "rgba(159, 90, 43, 0.05)",
      stroke: "rgba(80, 61, 41, 0.1)",
      "stroke-width": 1,
      rx: 14,
    });
    elevationPreview.append(overlay);

    const label = createSvgNode("text", {
      x: wallLeft + 12,
      y: zoneTop + 22,
      "font-size": 14,
      "font-family": "Avenir Next, Segoe UI, sans-serif",
      "font-weight": 600,
      fill: "#7f4419",
    });
    label.textContent = zone.key;
    elevationPreview.append(label);

    const divider = createSvgNode("line", {
      x1: wallLeft,
      y1: zoneTop,
      x2: wallLeft + wallWidth,
      y2: zoneTop,
      stroke: "rgba(80, 61, 41, 0.14)",
      "stroke-width": 1,
    });
    elevationPreview.append(divider);

    for (const row of zone.rows) {
      const rowBottom = toY(row.absoluteY);
      const rowCenterY = toY(row.absoluteY + row.resolvedHeight / 2);
      for (const item of row.items) {
        const itemHeight = Math.min(
          row.resolvedHeight * 0.74,
          item.type === "door" || item.type === "entry" ? row.resolvedHeight * 0.9 : row.resolvedHeight * 0.68
        );
        const frameX = toX(item.x - item.width / 2);
        const frameY = rowCenterY - itemHeight * scaleY / 2;
        const frameWidth = item.width * scaleX;
        const frameHeight = itemHeight * scaleY;

        const frame = createSvgNode("rect", {
          x: frameX,
          y: frameY,
          width: frameWidth,
          height: frameHeight,
          rx: item.type === "oculus" ? frameWidth / 2 : 8,
          fill: item.type === "door" || item.type === "entry" ? "#d0bfaa" : "#c5b097",
          stroke: "rgba(80, 61, 41, 0.25)",
          "stroke-width": 1.5,
        });
        elevationPreview.append(frame);

        if (item.type === "window" || item.type === "glass") {
          elevationPreview.append(
            createSvgNode("rect", {
              x: frameX + frameWidth * 0.12,
              y: frameY + frameHeight * 0.11,
              width: frameWidth * 0.76,
              height: frameHeight * 0.78,
              rx: 6,
              fill: "#8fb0bf",
              opacity: item.type === "glass" ? 0.95 : 0.88,
            })
          );
          if (item.sill) {
            elevationPreview.append(
              createSvgNode("rect", {
                x: frameX + frameWidth * 0.08,
                y: frameY + frameHeight * 0.92,
                width: frameWidth * 0.84,
                height: 5,
                rx: 3,
                fill: "#c5b097",
              })
            );
          }
        } else if (item.type === "door" || item.type === "entry") {
          elevationPreview.append(
            createSvgNode("rect", {
              x: frameX + frameWidth * 0.14,
              y: frameY + frameHeight * 0.12,
              width: frameWidth * 0.72,
              height: frameHeight * 0.88,
              rx: 6,
              fill: "#5c5349",
            })
          );
          if (item.arch) {
            elevationPreview.append(
              createSvgNode("path", {
                d: `M ${frameX + frameWidth * 0.24} ${frameY + frameHeight * 0.3} A ${frameWidth * 0.26} ${
                  frameHeight * 0.26
                } 0 0 1 ${frameX + frameWidth * 0.76} ${frameY + frameHeight * 0.3}`,
                fill: "none",
                stroke: "#c5b097",
                "stroke-width": 6,
                "stroke-linecap": "round",
              })
            );
          }
        } else if (item.type === "oculus") {
          elevationPreview.append(
            createSvgNode("circle", {
              cx: frameX + frameWidth / 2,
              cy: frameY + frameHeight / 2,
              r: Math.min(frameWidth, frameHeight) * 0.26,
              fill: "#8fb0bf",
            })
          );
        } else if (item.type === "screen") {
          for (let slat = -2; slat <= 2; slat += 1) {
            elevationPreview.append(
              createSvgNode("rect", {
                x: frameX + frameWidth / 2 + slat * frameWidth * 0.16 - 4,
                y: frameY + frameHeight * 0.08,
                width: 8,
                height: frameHeight * 0.84,
                rx: 3,
                fill: "#5c5349",
              })
            );
          }
        }

        if (item.header === "lintel") {
          elevationPreview.append(
            createSvgNode("rect", {
              x: frameX - frameWidth * 0.05,
              y: frameY - 8,
              width: frameWidth * 1.1,
              height: 8,
              rx: 4,
              fill: "#c5b097",
            })
          );
        } else if (item.header === "pediment") {
          elevationPreview.append(
            createSvgNode("path", {
              d: `M ${frameX + frameWidth * 0.08} ${frameY - 1} L ${frameX + frameWidth / 2} ${
                frameY - 18
              } L ${frameX + frameWidth * 0.92} ${frameY - 1} Z`,
              fill: "#c5b097",
            })
          );
        } else if (item.header === "arch") {
          elevationPreview.append(
            createSvgNode("path", {
              d: `M ${frameX + frameWidth * 0.18} ${frameY + 2} A ${frameWidth * 0.32} ${frameHeight * 0.22} 0 0 1 ${
                frameX + frameWidth * 0.82
              } ${frameY + 2}`,
              fill: "none",
              stroke: "#c5b097",
              "stroke-width": 6,
              "stroke-linecap": "round",
            })
          );
        }

        if (item.balcony && row.floorIndex % item.balcony.every === 0) {
          const slabDepth = Math.max(10, frameHeight * 0.12);
          const slabY = rowBottom - frameHeight * 0.1;
          elevationPreview.append(
            createSvgNode("rect", {
              x: frameX + frameWidth * 0.04,
              y: slabY,
              width: frameWidth * 0.92,
              height: slabDepth,
              rx: 4,
              fill: "#8a8d92",
            })
          );
          elevationPreview.append(
            createSvgNode("rect", {
              x: frameX + frameWidth * 0.08,
              y: slabY - frameHeight * 0.24,
              width: frameWidth * 0.84,
              height: 4,
              fill: "#5c5349",
            })
          );
        }
      }
    }

    for (const ornament of zone.ornaments) {
      const ornamentY = toY(zone.y + ornament.offsetY);
      elevationPreview.append(
        createSvgNode("rect", {
          x: wallLeft,
          y: ornamentY - Math.max(2, ornament.size * scaleY * 0.5),
          width: wallWidth,
          height: Math.max(4, ornament.size * scaleY),
          rx: 3,
          fill: "#c5b097",
          opacity: ornament.type === "band" ? 0.75 : 0.92,
        })
      );
    }
  }
}

function renderComponentLibrary(components) {
  componentLibrary.replaceChildren();

  if (!components.length) {
    const empty = document.createElement("p");
    empty.className = "focus-subtitle";
    empty.textContent = "No facade components found in this JSON.";
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
    const zoneList = [...component.zones].join(", ");
    meta.textContent = `${component.count} instance${component.count === 1 ? "" : "s"} on this segment${
      zoneList ? ` • ${zoneList}` : ""
    }`;

    const note = document.createElement("p");
    note.textContent = `Preview key: "${component.type}"`;

    card.append(thumb, title, meta, note);
    componentLibrary.append(card);
  }
}

function getPreviewFacadeState() {
  const appliedFacade = state.facades[state.selectedSide];
  const source = { facade: appliedFacade, mode: "applied", error: null };

  if (!facadeEditor.value.trim()) {
    return source;
  }

  try {
    return {
      facade: JSON.parse(facadeEditor.value),
      mode: "editor",
      error: null,
    };
  } catch (error) {
    return {
      facade: appliedFacade,
      mode: "fallback",
      error,
    };
  }
}

function renderFocusPanel() {
  if (!state.selectedSegment) {
    focusTitle.textContent = "Select a wall";
    focusSubtitle.textContent = "Pick a facade to open a flat elevation preview next to the 3D scene.";
    previewStatus.textContent = "Applied facade";
    previewStatus.classList.remove("error");
    renderElevationPreview(null);
    renderComponentLibrary([]);
    return;
  }

  const previewFacadeState = getPreviewFacadeState();
  const previewData = createFacadePreviewData(
    state.selectedSegment,
    state.floors * state.floorHeight,
    previewFacadeState.facade,
    state.floorHeight
  );

  focusTitle.textContent = `${state.selectedSegment.side} facade • ${state.selectedSegment.length.toFixed(1)}m`;
  focusSubtitle.textContent =
    state.selectedSide === state.selectedSegment.side
      ? `${state.selectedSegment.isHole ? "Inner" : "Outer"} wall aligned beside the 3D view.`
      : `Previewing "${state.selectedSide}" JSON on the selected ${state.selectedSegment.side} wall.`;

  if (previewFacadeState.mode === "editor") {
    previewStatus.textContent = "Live from editor";
    previewStatus.classList.remove("error");
  } else if (previewFacadeState.mode === "fallback") {
    previewStatus.textContent = `Invalid JSON, showing applied facade`;
    previewStatus.classList.add("error");
  } else {
    previewStatus.textContent = "Applied facade";
    previewStatus.classList.remove("error");
  }

  renderElevationPreview(previewData);
  renderComponentLibrary(previewData.components);
}

function updateFocusUi() {
  const active = state.focusMode && Boolean(state.selectedSegment);
  viewportShell.classList.toggle("focus-active", active);
  facadeFocus.setAttribute("aria-hidden", String(!active));
  toggleFocusButton.disabled = !state.selectedSegment;
  toggleFocusButton.textContent = active ? "Hide facade focus" : "Open facade focus";
}

function setFocusMode(enabled, { alignCamera = true } = {}) {
  state.focusMode = Boolean(enabled && state.selectedSegment);
  updateFocusUi();
  if (!alignCamera && !state.focusMode) {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    return;
  }
  resize();
}

function alignCameraToSelectedSegment() {
  if (!state.selectedSegment) return;

  const totalHeight = state.floors * state.floorHeight;
  const center = state.selectedSegment.center.clone().add(stage.position);
  center.y = totalHeight / 2;

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = Math.max(0.4, mount.clientWidth / Math.max(1, mount.clientHeight));
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const widthDistance = (state.selectedSegment.length * 0.58) / Math.tan(horizontalFov / 2);
  const heightDistance = (totalHeight * 0.62) / Math.tan(verticalFov / 2);
  const distance = Math.max(10, widthDistance, heightDistance);

  camera.position.copy(center).addScaledVector(state.selectedSegment.normal.clone().normalize(), distance);
  controls.target.copy(center);
  controls.update();
}

function refreshEditor() {
  const side = state.selectedSide;
  facadeEditor.value = JSON.stringify(state.facades[side], null, 2);
}

function updateSelectionInfo() {
  if (!state.selectedSegment) {
    selectionInfo.textContent = "Click a wall segment in the scene to inspect its facade assignment.";
    toggleFocusButton.disabled = true;
    return;
  }
  selectionInfo.innerHTML = [
    `<strong>Side:</strong> ${state.selectedSegment.side}`,
    `<strong>Length:</strong> ${state.selectedSegment.length.toFixed(2)}m`,
    `<strong>Inner wall:</strong> ${state.selectedSegment.isHole ? "yes" : "no"}`,
  ].join("<br>");
  toggleFocusButton.disabled = false;
}

function rebuildScene() {
  const previousSelection = cloneSelectionSignature(state.selectedSegment);
  wallPickers = [];
  stage.clear();

  const rng = createRng(state.seed);
  const footprint = generateFootprint(state.plotType, rng);
  state.selectedSegment = findMatchingSegment(footprint.wallSegments, previousSelection);
  const totalHeight = state.floors * state.floorHeight;

  const buildingShape = footprint.shape;
  const geometry = new THREE.ExtrudeGeometry(buildingShape, {
    depth: totalHeight,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);

  const mass = new THREE.Mesh(geometry, materials.mass);
  mass.castShadow = true;
  mass.receiveShadow = true;
  stage.add(mass);

  for (const segment of footprint.wallSegments) {
    const facade = state.facades[segment.side] || state.facades.inner;
    const facadeGroup = buildFacadeForSegment(segment, totalHeight, facade, state.floorHeight);
    facadeGroup.position.copy(segment.center);
    orientObjectToSegment(facadeGroup, segment);
    facadeGroup.position.addScaledVector(segment.normal, 0.13);
    stage.add(facadeGroup);

    const picker = new THREE.Mesh(
      new THREE.PlaneGeometry(segment.length, totalHeight),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    );
    picker.position.set(segment.center.x, totalHeight / 2, segment.center.z);
    orientObjectToSegment(picker, segment);
    picker.userData.segment = segment;
    stage.add(picker);
    wallPickers.push(picker);
  }

  const roof = new THREE.Mesh(
    new THREE.ShapeGeometry(buildingShape),
    new THREE.MeshStandardMaterial({ color: "#a68c6d", roughness: 0.96 })
  );
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = totalHeight + 0.02;
  roof.receiveShadow = true;
  stage.add(roof);

  const bbox = new THREE.Box3().setFromObject(stage);
  const center = bbox.getCenter(new THREE.Vector3());
  stage.position.sub(center);
  stage.position.y = 0;
  controls.target.set(0, totalHeight * 0.45, 0);

  if (state.selectedSegment) {
    state.selectedSide = state.selectedSide || state.selectedSegment.side;
    facadeSideSelect.value = state.selectedSide;
  } else if (state.focusMode) {
    state.focusMode = false;
  }

  updateSelectionInfo();
  renderFocusPanel();
  updateFocusUi();

  if (state.focusMode && state.selectedSegment) {
    alignCameraToSelectedSegment();
  }
}

function applyFacadeJson() {
  const side = state.selectedSide;
  const parsed = JSON.parse(facadeEditor.value);
  state.facades[side] = parsed;
  rebuildScene();
}

function loadPreset(key) {
  state.facades[state.selectedSide] = structuredClone(facadePresets[key]);
  refreshEditor();
  rebuildScene();
}

function randomizeAll() {
  const rng = createRng(Date.now());
  state.seed = randomInt(rng, 1, 999999);
  seedInput.value = String(state.seed);
  state.plotType = choose(rng, plotTypes);
  plotTypeSelect.value = state.plotType;
  state.floors = randomInt(rng, 3, 10);
  floorsInput.value = String(state.floors);
  floorsValue.textContent = String(state.floors);
  state.floorHeight = Number((2.9 + rng() * 1.6).toFixed(1));
  floorHeightInput.value = String(state.floorHeight);
  floorHeightValue.textContent = `${state.floorHeight.toFixed(1)}m`;
  for (const side of facadeSides) {
    state.facades[side] = structuredClone(facadePresets[choose(rng, Object.keys(facadePresets))]);
  }
  refreshEditor();
  rebuildScene();
}

plotTypeSelect.addEventListener("change", () => {
  state.plotType = plotTypeSelect.value;
});

floorsInput.addEventListener("input", () => {
  state.floors = Number(floorsInput.value);
  floorsValue.textContent = floorsInput.value;
});

floorHeightInput.addEventListener("input", () => {
  state.floorHeight = Number(floorHeightInput.value);
  floorHeightValue.textContent = `${state.floorHeight.toFixed(1)}m`;
});

seedInput.addEventListener("change", () => {
  state.seed = Number(seedInput.value);
});

facadeSideSelect.addEventListener("change", () => {
  state.selectedSide = facadeSideSelect.value;
  refreshEditor();
  renderFocusPanel();
});

facadeEditor.addEventListener("input", () => {
  renderFocusPanel();
});

document.querySelector("#regenerate").addEventListener("click", rebuildScene);
document.querySelector("#randomizeShape").addEventListener("click", () => {
  const rng = createRng(Date.now());
  state.plotType = choose(rng, plotTypes);
  plotTypeSelect.value = state.plotType;
  rebuildScene();
});
document.querySelector("#randomizeAll").addEventListener("click", randomizeAll);
document.querySelector("#applyFacade").addEventListener("click", () => {
  try {
    applyFacadeJson();
  } catch (error) {
    alert(`Invalid facade JSON: ${error.message}`);
  }
});
document.querySelector("#loadPreset").addEventListener("click", () => loadPreset(facadePresetSelect.value));
toggleFocusButton.addEventListener("click", () => {
  setFocusMode(!state.focusMode);
});
alignFocusViewButton.addEventListener("click", () => {
  alignCameraToSelectedSegment();
});
closeFocusButton.addEventListener("click", () => {
  setFocusMode(false, { alignCamera: false });
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(wallPickers);
  if (hits.length) {
    state.selectedSegment = hits[0].object.userData.segment;
    state.selectedSide = state.selectedSegment.side;
    facadeSideSelect.value = state.selectedSide;
    refreshEditor();
    updateSelectionInfo();
    renderFocusPanel();
    setFocusMode(true);
  }
});

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

refreshEditor();
updateSelectionInfo();
renderFocusPanel();
updateFocusUi();
resize();
rebuildScene();
animate();
