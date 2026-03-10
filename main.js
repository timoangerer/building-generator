import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ASSET_HOUSE_STANDARD, groupPartsByRole, resolveAssetPart } from "./asset-library.js";
import {
  loadVeniceModularBuildingPartsCatalog,
  veniceModularBuildingPartsDescriptor,
} from "./asset-kits/venice-modular-building-parts.js";

const plotTypes = ["square", "rectangle", "l-shape", "h-shape", "o-shape", "courtyard"];
const facadeSides = ["north", "east", "south", "west", "inner"];
const appRoutes = new Set(["workbench", "viewer", "facade", "assets"]);
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
                assetQuery: { role: "door", tags: ["arched", "ground-floor"] },
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
                assetQuery: { role: "window", tags: ["arched", "classical"] },
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
                assetQuery: { role: "window", tags: ["lintel", "wide"] },
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
                assetQuery: { role: "oculus", tags: ["round"] },
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
const assetMount = document.querySelector("#assetSceneMount");
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
const assetKitSelect = document.querySelector("#assetKit");
const assetKitStatus = document.querySelector("#assetKitStatus");
const assetStandardInfo = document.querySelector("#assetStandardInfo");
const assetSelectionInfo = document.querySelector("#assetSelectionInfo");
const assetInventory = document.querySelector("#assetInventory");
const routeLinks = [...document.querySelectorAll("[data-route-link]")];
const routeViews = [...document.querySelectorAll("[data-route-view]")];
const routePanelGroups = [...document.querySelectorAll("[data-route-panels]")];

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

for (const kit of [veniceModularBuildingPartsDescriptor]) {
  const option = document.createElement("option");
  option.value = kit.id;
  option.textContent = kit.name;
  assetKitSelect.append(option);
}

const state = {
  route: "viewer",
  plotType: plotTypeSelect.value,
  floors: Number(floorsInput.value),
  floorHeight: Number(floorHeightInput.value),
  seed: Number(seedInput.value),
  facades: structuredClone(defaultFacadeMap),
  selectedSide: facadeSideSelect.value,
  selectedSegment: null,
  selectedAssetKitId: assetKitSelect.value,
  assetCatalog: null,
  assetCatalogStatus: "idle",
  selectedAssetPartId: null,
  assetPreviewState: "idle",
  assetPreviewMessage: "Select a parsed part to inspect its GLB preview.",
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

const assetScene = new THREE.Scene();
assetScene.background = new THREE.Color("#e7ddc8");
assetScene.fog = new THREE.Fog("#e7ddc8", 18, 54);

const assetCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
assetCamera.position.set(5.6, 4.2, 7.4);

const assetRenderer = new THREE.WebGLRenderer({ antialias: true });
assetRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
assetRenderer.shadowMap.enabled = true;
assetRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
assetMount.append(assetRenderer.domElement);

const assetControls = new OrbitControls(assetCamera, assetRenderer.domElement);
assetControls.enableDamping = true;
assetControls.target.set(0, 1.6, 0);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const stage = new THREE.Group();
scene.add(stage);

const assetStage = new THREE.Group();
assetScene.add(assetStage);

const ambient = new THREE.HemisphereLight("#fff4dc", "#9a876f", 1.5);
scene.add(ambient);

const assetAmbient = new THREE.HemisphereLight("#fff5de", "#95836e", 1.45);
assetScene.add(assetAmbient);

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

const assetSun = new THREE.DirectionalLight("#fff8ea", 1.5);
assetSun.position.set(8, 12, 9);
assetSun.castShadow = true;
assetSun.shadow.mapSize.set(1024, 1024);
assetSun.shadow.camera.near = 1;
assetSun.shadow.camera.far = 40;
assetSun.shadow.camera.left = -10;
assetSun.shadow.camera.right = 10;
assetSun.shadow.camera.top = 10;
assetSun.shadow.camera.bottom = -10;
assetScene.add(assetSun);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(68, 72),
  new THREE.MeshStandardMaterial({ color: "#c8b999", roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const assetGround = new THREE.Mesh(
  new THREE.CircleGeometry(18, 48),
  new THREE.MeshStandardMaterial({ color: "#cbbb9d", roughness: 1 })
);
assetGround.rotation.x = -Math.PI / 2;
assetGround.receiveShadow = true;
assetScene.add(assetGround);

const grid = new THREE.GridHelper(90, 30, "#a17d54", "#baaa92");
grid.position.y = 0.02;
scene.add(grid);

const assetGrid = new THREE.GridHelper(20, 20, "#a58258", "#b8ab93");
assetGrid.position.y = 0.02;
assetScene.add(assetGrid);

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
const assetProxyMaterials = new Map();
const assetPreviewLoader = new GLTFLoader();
const assetPreviewSourceCache = new Map();
let assetPreviewRequestToken = 0;

function getAssetProxyMaterial(color) {
  if (!assetProxyMaterials.has(color)) {
    assetProxyMaterials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.06 })
    );
  }
  return assetProxyMaterials.get(color);
}

function setAssetPreviewStatus(stateName, message) {
  state.assetPreviewState = stateName;
  state.assetPreviewMessage = message;
  renderAssetSelectionInfo();
}

function degreesToRadians(value) {
  return THREE.MathUtils.degToRad(value || 0);
}

function applyAssetCorrection(node, correction) {
  node.rotation.set(
    degreesToRadians(correction?.rotate?.x),
    degreesToRadians(correction?.rotate?.y),
    degreesToRadians(correction?.rotate?.z)
  );
  const uniformScale = correction?.uniformScale ?? 1;
  node.scale.setScalar(uniformScale);
}

function enableAssetShadows(node) {
  node.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
}

async function loadAssetPreviewSource(assetPart) {
  if (!assetPart?.sourcePath) return null;

  if (!assetPreviewSourceCache.has(assetPart.id)) {
    const sourcePromise = new Promise((resolve, reject) => {
      assetPreviewLoader.load(
        assetPart.sourcePath,
        (gltf) => {
          const root = gltf.scene || gltf.scenes?.[0] || null;
          if (!root) {
            reject(new Error(`GLB ${assetPart.sourceFile || assetPart.sourceName} has no scene root.`));
            return;
          }

          enableAssetShadows(root);
          resolve(root);
        },
        undefined,
        reject
      );
    }).catch((error) => {
      assetPreviewSourceCache.delete(assetPart.id);
      throw error;
    });

    assetPreviewSourceCache.set(assetPart.id, sourcePromise);
  }

  return assetPreviewSourceCache.get(assetPart.id);
}

function buildAssetModelPreviewNode(assetPart, sourceRoot) {
  const group = new THREE.Group();
  const model = sourceRoot.clone(true);
  applyAssetCorrection(model, assetPart.correction);
  group.add(model);
  return group;
}

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

function resizeRenderer(targetMount, targetCamera, targetRenderer) {
  const { clientWidth, clientHeight } = targetMount;
  if (!clientWidth || !clientHeight) return;
  targetCamera.aspect = clientWidth / clientHeight;
  targetCamera.updateProjectionMatrix();
  targetRenderer.setSize(clientWidth, clientHeight);
}

function resize() {
  resizeRenderer(mount, camera, renderer);
  resizeRenderer(assetMount, assetCamera, assetRenderer);
}

window.addEventListener("resize", resize);

function parseRouteTokens(value) {
  return (value || "").split(/\s+/).filter(Boolean);
}

function getCurrentRoute() {
  const route = window.location.hash.replace(/^#/, "") || "viewer";
  return appRoutes.has(route) ? route : "viewer";
}

function renderRoute() {
  state.route = getCurrentRoute();

  for (const link of routeLinks) {
    link.dataset.active = String(link.dataset.routeLink === state.route);
  }

  for (const view of routeViews) {
    const visible = parseRouteTokens(view.dataset.routeView).includes(state.route);
    view.classList.toggle("is-visible", visible);
  }

  for (const group of routePanelGroups) {
    const visible = parseRouteTokens(group.dataset.routePanels).includes(state.route);
    group.classList.toggle("is-visible", visible);
  }

  resize();
}

function renderAssetStandardInfo() {
  assetStandardInfo.innerHTML = [
    `<strong>Units:</strong> ${ASSET_HOUSE_STANDARD.units}`,
    `<strong>Axes:</strong> right ${ASSET_HOUSE_STANDARD.axes.right}, up ${ASSET_HOUSE_STANDARD.axes.up}, outward ${ASSET_HOUSE_STANDARD.axes.outward}`,
    `<strong>Opening anchor:</strong> ${ASSET_HOUSE_STANDARD.anchors["opening-bottom-center"]}`,
  ].join("<br>");
}

function getSelectedAssetPart() {
  if (!state.assetCatalog?.parts?.length) return null;
  return (
    state.assetCatalog.parts.find((part) => part.id === state.selectedAssetPartId) ||
    state.assetCatalog.parts[0]
  );
}

function renderAssetSelectionInfo() {
  const part = getSelectedAssetPart();
  if (!part) {
    assetSelectionInfo.textContent = "Select a parsed part to inspect its contract and GLB preview.";
    return;
  }

  assetSelectionInfo.innerHTML = [
    `<strong>Noun:</strong> ${part.noun}`,
    `<strong>Role:</strong> ${part.role}`,
    `<strong>Family:</strong> ${part.family}`,
    `<strong>Variant code:</strong> ${part.variantCode || "Main"}`,
    `<strong>Instance:</strong> ${part.instance || "Base"}`,
    `<strong>Variant:</strong> ${part.variant}`,
    `<strong>Source:</strong> ${part.sourceName}`,
    `<strong>File:</strong> ${part.sourceFile || "Unknown"}`,
    `<strong>Anchor:</strong> ${part.anchor}`,
    `<strong>Dimensions:</strong> ${part.dimensions.width.toFixed(2)}m x ${part.dimensions.height.toFixed(2)}m x ${part.dimensions.depth.toFixed(2)}m`,
    `<strong>Correction:</strong> rotate ${part.correction.rotate.x}/${part.correction.rotate.y}/${part.correction.rotate.z} deg, scale ${part.correction.uniformScale}`,
    `<strong>Preview:</strong> ${state.assetPreviewMessage}`,
    `<strong>Tags:</strong> ${part.tags.join(", ")}`,
  ].join("<br>");
}

function renderAssetInventory() {
  if (!state.assetCatalog?.parts?.length) {
    assetInventory.innerHTML = '<p class="inventory-empty">No parsed source parts loaded yet.</p>';
    return;
  }

  const selectedPart = getSelectedAssetPart();
  const sections = groupPartsByRole(state.assetCatalog)
    .map(
      ({ role, parts }) => `
        <section class="inventory-group">
          <h3>${role} <span>${parts.length}</span></h3>
          ${parts
            .map(
              (part) => `
                <button
                  class="inventory-item ${selectedPart?.id === part.id ? "is-active" : ""}"
                  type="button"
                  data-part-id="${part.id}"
                >
                  <strong>${part.label}</strong>
                  <span>${part.sourceFile || part.sourceName}</span>
                  <span>${part.family} / ${part.variant}</span>
                  <span>${part.dimensions.width.toFixed(2)}m x ${part.dimensions.height.toFixed(2)}m x ${part.dimensions.depth.toFixed(2)}m</span>
                </button>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");

  assetInventory.innerHTML = sections;
}

function renderAssetKitStatus(message, stateName = "ready") {
  assetKitStatus.textContent = message;
  assetKitStatus.dataset.state = stateName;
}

async function loadAssetKit(kitId) {
  state.selectedAssetKitId = kitId;
  state.assetCatalogStatus = "loading";
  state.assetPreviewState = "loading";
  state.assetPreviewMessage = "Loading parsed inventory...";
  renderAssetKitStatus("Loading parsed GLB inventory...", "loading");
  assetInventory.innerHTML = '<p class="inventory-empty">Loading inventory...</p>';

  try {
    if (kitId === veniceModularBuildingPartsDescriptor.id) {
      state.assetCatalog = await loadVeniceModularBuildingPartsCatalog();
    } else {
      state.assetCatalog = null;
    }

    const count = state.assetCatalog?.parts?.length || 0;
    state.selectedAssetPartId = state.assetCatalog?.parts?.[0]?.id || null;
    state.assetCatalogStatus = "ready";
    const name = state.assetCatalog?.name || "Unknown kit";
    renderAssetKitStatus(`${name}: ${count} GLB parts parsed from the source folder.`, "ready");
    renderAssetInventory();
    renderAssetSelectionInfo();
    void rebuildAssetPreview();
    rebuildScene();
  } catch (error) {
    state.assetCatalog = null;
    state.assetCatalogStatus = "error";
    state.selectedAssetPartId = null;
    state.assetPreviewState = "error";
    state.assetPreviewMessage = "Could not load the asset kit.";
    renderAssetKitStatus(error.message, "error");
    renderAssetInventory();
    renderAssetSelectionInfo();
    void rebuildAssetPreview();
    rebuildScene();
  }
}

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

function fitAssetPartToSlot(assetPart, slotWidth, slotHeight) {
  const scale = Math.min(slotWidth / assetPart.dimensions.width, slotHeight / assetPart.dimensions.height);
  return {
    width: assetPart.dimensions.width * scale,
    height: assetPart.dimensions.height * scale,
    depth: Math.max(0.08, assetPart.dimensions.depth * scale),
  };
}

function buildAssetProxyElement(item, rowHeight, floorIndex, assetPart) {
  const group = new THREE.Group();
  const maxHeight = Math.min(
    rowHeight * 0.74,
    item.type === "door" || item.type === "entry" ? rowHeight * 0.9 : rowHeight * 0.68
  );
  const fitted = fitAssetPartToSlot(assetPart, item.width, maxHeight);
  const proxyMaterial = getAssetProxyMaterial(assetPart.previewColor);

  if (assetPart.role === "window" || assetPart.role === "entry" || assetPart.role === "door") {
    const frame = makeBox(fitted.width, fitted.height, fitted.depth, materials.trim);
    frame.position.z = 0.03;
    const body = makeBox(fitted.width * 0.78, fitted.height * 0.8, Math.max(0.06, fitted.depth * 0.42), proxyMaterial);
    body.position.z = 0.05;
    group.add(frame, body);
    if (assetPart.tags.includes("arched")) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(fitted.width * 0.28, 0.06, 12, 28, Math.PI),
        materials.trim
      );
      arch.rotation.z = Math.PI;
      arch.position.set(0, fitted.height * 0.48, 0.08);
      arch.castShadow = true;
      group.add(arch);
    }
  } else if (assetPart.role === "oculus") {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(fitted.width * 0.3, 0.08, 14, 26),
      materials.trim
    );
    const pane = new THREE.Mesh(
      new THREE.CircleGeometry(fitted.width * 0.24, 28),
      proxyMaterial
    );
    pane.position.z = 0.04;
    ring.castShadow = true;
    group.add(ring, pane);
  } else if (assetPart.role === "screen") {
    const panel = makeBox(fitted.width, fitted.height, fitted.depth, proxyMaterial);
    group.add(panel);
  } else if (assetPart.role === "balcony") {
    const slab = makeBox(fitted.width, 0.18, Math.max(fitted.depth, 0.8), proxyMaterial);
    slab.position.z = Math.max(fitted.depth, 0.8) / 2;
    slab.position.y = -fitted.height * 0.4;
    group.add(slab);
  }

  if (item.balcony && floorIndex % item.balcony.every === 0) {
    const slab = makeBox(item.width * 0.92, 0.16, item.balcony.depth, materials.balcony);
    slab.position.set(0, -fitted.height * 0.62, item.balcony.depth / 2 - 0.02);
    group.add(slab);

    const rail = makeBox(item.width * 0.9, item.balcony.railHeight, 0.06, materials.dark);
    rail.position.set(0, -fitted.height * 0.18, item.balcony.depth - 0.04);
    group.add(rail);

    const sideRail = makeBox(0.05, item.balcony.railHeight, item.balcony.depth, materials.dark);
    const left = sideRail.clone();
    const right = sideRail.clone();
    left.position.set(-item.width * 0.45, -fitted.height * 0.18, item.balcony.depth / 2);
    right.position.set(item.width * 0.45, -fitted.height * 0.18, item.balcony.depth / 2);
    group.add(left, right);
  }

  group.userData.assetPart = assetPart;
  return group;
}

function buildFacadeElement(item, rowHeight, floorIndex) {
  const assetPart = resolveAssetPart(state.assetCatalog, item);
  if (assetPart) {
    return buildAssetProxyElement(item, rowHeight, floorIndex, assetPart);
  }

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
  const assetPart = resolveAssetPart(state.assetCatalog, { type, assetQuery: { role: type } });
  if (assetPart) {
    const ornament = makeBox(
      length,
      Math.max(size, assetPart.dimensions.height),
      Math.max(0.14, assetPart.dimensions.depth),
      getAssetProxyMaterial(assetPart.previewColor)
    );
    ornament.position.set(0, offsetY, assetPart.dimensions.depth / 2);
    ornament.userData.assetPart = assetPart;
    return ornament;
  }

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

function buildAssetPreviewNode(assetPart) {
  const group = new THREE.Group();
  const proxyMaterial = getAssetProxyMaterial(assetPart.previewColor);
  const { width, height, depth } = assetPart.dimensions;

  if (["window", "door", "entry", "oculus", "screen"].includes(assetPart.role)) {
    const backing = makeBox(width * 1.6, Math.max(height * 1.5, 2.2), 0.2, materials.wall);
    backing.position.set(0, Math.max(height * 0.2, 0.9), -0.12);
    group.add(backing);
  }

  if (assetPart.role === "window" || assetPart.role === "door" || assetPart.role === "entry") {
    const frame = makeBox(width, height, depth, materials.trim);
    frame.position.y = height / 2;
    frame.position.z = depth / 2;
    const body = makeBox(width * 0.78, height * 0.8, Math.max(0.06, depth * 0.42), proxyMaterial);
    body.position.y = height / 2;
    body.position.z = depth * 0.64;
    group.add(frame, body);

    if (assetPart.tags.includes("arched")) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(width * 0.28, 0.06, 12, 28, Math.PI),
        materials.trim
      );
      arch.rotation.z = Math.PI;
      arch.position.set(0, height, depth * 0.72);
      arch.castShadow = true;
      group.add(arch);
    }
  } else if (assetPart.role === "oculus") {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(width * 0.32, 0.08, 14, 26), materials.trim);
    ring.position.y = height * 0.7;
    ring.position.z = depth * 0.6;
    ring.castShadow = true;
    const pane = new THREE.Mesh(new THREE.CircleGeometry(width * 0.24, 28), proxyMaterial);
    pane.position.set(0, height * 0.7, depth * 0.7);
    group.add(ring, pane);
  } else if (assetPart.role === "screen") {
    const panel = makeBox(width, height, depth, proxyMaterial);
    panel.position.y = height / 2;
    panel.position.z = depth / 2;
    group.add(panel);
  } else if (assetPart.role === "balcony") {
    const slab = makeBox(width, Math.max(0.18, height * 0.16), Math.max(depth, 0.9), proxyMaterial);
    slab.position.set(0, Math.max(0.4, height * 0.2), Math.max(depth, 0.9) / 2);
    group.add(slab);
  } else if (assetPart.role === "cornice" || assetPart.role === "band") {
    const strip = makeBox(width, height, depth, proxyMaterial);
    strip.position.y = height / 2;
    strip.position.z = depth / 2;
    group.add(strip);
  } else {
    const generic = makeBox(width, height, depth, proxyMaterial);
    generic.position.y = height / 2;
    generic.position.z = depth / 2;
    group.add(generic);
  }

  return group;
}

async function rebuildAssetPreview() {
  const requestToken = ++assetPreviewRequestToken;
  assetStage.clear();
  assetStage.position.set(0, 0, 0);
  const assetPart = getSelectedAssetPart();
  if (!assetPart) return;

  let node = null;

  if (assetPart.sourcePath) {
    setAssetPreviewStatus("loading", `Loading GLB ${assetPart.sourceFile || assetPart.sourceName}...`);

    try {
      const sourceRoot = await loadAssetPreviewSource(assetPart);
      if (requestToken !== assetPreviewRequestToken) return;
      node = buildAssetModelPreviewNode(assetPart, sourceRoot);
      setAssetPreviewStatus("ready", `Showing the actual GLB ${assetPart.sourceFile || assetPart.sourceName}.`);
    } catch (error) {
      console.error(error);
      if (requestToken !== assetPreviewRequestToken) return;
      setAssetPreviewStatus(
        "error",
        `GLB load failed for ${assetPart.sourceFile || assetPart.sourceName}; showing a proxy instead.`
      );
    }
  }

  if (!node) {
    node = buildAssetPreviewNode(assetPart);
    if (!assetPart.sourcePath) {
      setAssetPreviewStatus("idle", "No GLB path recorded; showing a proxy.");
    }
  }

  assetStage.add(node);

  const bbox = new THREE.Box3().setFromObject(assetStage);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  assetStage.position.sub(center);
  assetStage.position.y = Math.max(size.y / 2, 0.3);
  assetControls.target.set(0, Math.max(size.y * 0.4, 0.9), 0);
}

function selectAssetPart(partId) {
  state.selectedAssetPartId = partId;
  renderAssetInventory();
  renderAssetSelectionInfo();
  void rebuildAssetPreview();
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

function refreshEditor() {
  const side = state.selectedSide;
  facadeEditor.value = JSON.stringify(state.facades[side], null, 2);
}

function updateSelectionInfo() {
  if (!state.selectedSegment) {
    selectionInfo.textContent = "Click a wall segment in the scene to inspect its facade assignment.";
    return;
  }
  selectionInfo.innerHTML = [
    `<strong>Side:</strong> ${state.selectedSegment.side}`,
    `<strong>Length:</strong> ${state.selectedSegment.length.toFixed(2)}m`,
    `<strong>Inner wall:</strong> ${state.selectedSegment.isHole ? "yes" : "no"}`,
  ].join("<br>");
}

function rebuildScene() {
  wallPickers = [];
  stage.clear();

  const rng = createRng(state.seed);
  const footprint = generateFootprint(state.plotType, rng);
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
});

assetKitSelect.addEventListener("change", () => {
  loadAssetKit(assetKitSelect.value);
});

assetInventory.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-part-id]");
  if (!trigger) return;
  selectAssetPart(trigger.dataset.partId);
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
  }
});

window.addEventListener("hashchange", renderRoute);

function animate() {
  controls.update();
  assetControls.update();
  renderer.render(scene, camera);
  assetRenderer.render(assetScene, assetCamera);
  requestAnimationFrame(animate);
}

if (!window.location.hash || !appRoutes.has(window.location.hash.replace(/^#/, ""))) {
  window.location.hash = "viewer";
}

refreshEditor();
updateSelectionInfo();
renderAssetStandardInfo();
renderAssetSelectionInfo();
renderRoute();
resize();
rebuildScene();
loadAssetKit(state.selectedAssetKitId);
animate();
