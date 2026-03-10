const ROLE_DEFAULTS = {
  window: { category: "opening", anchor: "opening-bottom-center", previewColor: "#86a9b4" },
  door: { category: "opening", anchor: "opening-bottom-center", previewColor: "#6e5a49" },
  entry: { category: "opening", anchor: "opening-bottom-center", previewColor: "#755a42" },
  oculus: { category: "opening", anchor: "opening-center", previewColor: "#90b5c3" },
  screen: { category: "panel", anchor: "opening-center", previewColor: "#c0ab8b" },
  balcony: { category: "addon", anchor: "opening-bottom-center", previewColor: "#91969e" },
  cornice: { category: "ornament", anchor: "span-center", previewColor: "#ccb69a" },
  band: { category: "ornament", anchor: "span-center", previewColor: "#ccb69a" },
};

export const ASSET_HOUSE_STANDARD = {
  units: "meters",
  axes: {
    right: "+X",
    up: "+Y",
    outward: "+Z",
  },
  anchors: {
    "opening-bottom-center": "Origin sits at the bottom center on the facade attachment plane.",
    "opening-center": "Origin sits at the geometric center on the facade attachment plane.",
    "span-center": "Origin sits at the center of a wall-spanning element on the facade attachment plane.",
  },
};

function titleCase(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferRoleFromName(name = "") {
  const value = name.toLowerCase();
  if (value.includes("oculus")) return "oculus";
  if (value.includes("door") || value.includes("entry") || value.includes("portal")) return "door";
  if (value.includes("screen") || value.includes("shutter")) return "screen";
  if (value.includes("balcony")) return "balcony";
  if (value.includes("cornice")) return "cornice";
  if (value.includes("band") || value.includes("belt")) return "band";
  if (value.includes("window")) return "window";
  return "window";
}

function inferTags(name = "") {
  const value = name.toLowerCase();
  return unique([
    value.includes("arch") || value.includes("arched") ? "arched" : null,
    value.includes("pediment") ? "pediment" : null,
    value.includes("lintel") ? "lintel" : null,
    value.includes("ornate") ? "ornate" : null,
    value.includes("classical") ? "classical" : null,
    value.includes("modern") ? "modern" : null,
    value.includes("narrow") ? "narrow" : null,
    value.includes("wide") ? "wide" : null,
    value.includes("round") ? "round" : null,
  ]);
}

function inferVariant(rawPart, tags) {
  if (rawPart.variant) return rawPart.variant;
  const prioritized = tags.filter((tag) => !["classical", "modern", "ornate"].includes(tag));
  return prioritized.slice(0, 3).join("-") || "default";
}

function inferDimensions(dimensions) {
  if (dimensions?.width && dimensions?.height && dimensions?.depth) {
    return dimensions;
  }
  return { width: 1.4, height: 2.2, depth: 0.24 };
}

export function normalizePartRecord(rawPart, index = 0) {
  const sourceName = rawPart.sourceName || rawPart.fileName || rawPart.name || `part-${index + 1}`;
  const role = rawPart.role || inferRoleFromName(sourceName);
  const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.window;
  const tags = unique([...(rawPart.tags || []), ...inferTags(sourceName), role]);
  const correction = {
    rotate: {
      x: rawPart.correction?.rotate?.x || 0,
      y: rawPart.correction?.rotate?.y || 0,
      z: rawPart.correction?.rotate?.z || 0,
    },
    uniformScale: rawPart.correction?.uniformScale || 1,
  };

  return {
    id: rawPart.id || slugify(sourceName),
    label: rawPart.label || titleCase(sourceName),
    sourceName,
    sourcePath: rawPart.sourcePath || rawPart.modelPath || null,
    role,
    category: rawPart.category || defaults.category,
    variant: inferVariant(rawPart, tags),
    tags,
    anchor: rawPart.anchor || defaults.anchor,
    dimensions: inferDimensions(rawPart.dimensions),
    correction,
    previewColor: rawPart.previewColor || defaults.previewColor,
    notes: rawPart.notes || "",
  };
}

export function normalizeCatalog(rawCatalog, options = {}) {
  const parts = (rawCatalog.parts || []).map((part, index) => normalizePartRecord(part, index));
  return {
    id: rawCatalog.id || options.id,
    name: rawCatalog.name || options.name || "Unnamed kit",
    adapter: options.adapter || "generic",
    sourceRoot: rawCatalog.sourceRoot || options.sourceRoot || "",
    sourceConvention: rawCatalog.sourceConvention || options.sourceConvention || "Unspecified export convention",
    sourceOrientation: rawCatalog.sourceOrientation || {
      right: "+X",
      up: "+Z",
      forward: "+Y",
    },
    normalization: {
      ...ASSET_HOUSE_STANDARD,
      ...(rawCatalog.normalization || {}),
    },
    parts,
  };
}

export function deriveAssetQuery(item) {
  const roleMap = {
    entry: "entry",
  };
  const role = item.assetQuery?.role || roleMap[item.type] || item.type;
  const tags = unique([
    ...(item.assetQuery?.tags || []),
    item.header === "arch" || item.arch ? "arched" : null,
    item.header === "pediment" ? "pediment" : null,
    item.header === "lintel" ? "lintel" : null,
    item.sill ? "sill" : null,
  ]);

  return {
    id: item.assetQuery?.id || null,
    role,
    variant: item.assetQuery?.variant || null,
    tags,
  };
}

export function resolveAssetPart(catalog, item) {
  if (!catalog?.parts?.length) return null;
  const query = deriveAssetQuery(item);
  const candidates = catalog.parts.filter((part) => {
    if (query.id) return part.id === query.id;
    return part.role === query.role;
  });

  if (!candidates.length) return null;

  const scored = candidates.map((part) => {
    let score = 0;
    if (query.id && part.id === query.id) score += 1000;
    if (part.role === query.role) score += 50;
    if (query.variant && part.variant === query.variant) score += 24;
    for (const tag of query.tags) {
      if (part.tags.includes(tag)) score += 8;
    }
    if (part.tags.includes("default")) score += 1;
    return { part, score };
  });

  scored.sort((a, b) => b.score - a.score || a.part.id.localeCompare(b.part.id));
  return scored[0].part;
}

export function groupPartsByRole(catalog) {
  const groups = new Map();
  for (const part of catalog?.parts || []) {
    if (!groups.has(part.role)) groups.set(part.role, []);
    groups.get(part.role).push(part);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([role, parts]) => ({ role, parts: parts.sort((a, b) => a.variant.localeCompare(b.variant)) }));
}
