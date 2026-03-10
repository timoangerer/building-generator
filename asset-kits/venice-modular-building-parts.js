import { normalizeCatalog } from "../asset-library.js";

const SOURCE_ROOT = "./assets/venice_modular_building_parts/";
const SOURCE_GLOBS = import.meta.glob("../assets/venice_modular_building_parts/*.glb", {
  eager: true,
  query: "?url",
  import: "default",
});

const FAMILY_RULES = [
  {
    tokens: ["Giant", "Windows"],
    role: "window",
    noun: "window",
    category: "opening",
    tags: ["giant", "wide"],
    variantSeed: "Giant",
    dimensions: { width: 3.1, height: 3.9, depth: 0.34 },
  },
  {
    tokens: ["Windows"],
    role: "window",
    noun: "window",
    category: "opening",
    dimensions: { width: 1.8, height: 2.5, depth: 0.24 },
  },
  {
    tokens: ["Giant", "Door"],
    role: "door",
    noun: "door",
    category: "opening",
    tags: ["giant", "ground-floor"],
    variantSeed: "Giant",
    dimensions: { width: 2.8, height: 4.2, depth: 0.36 },
  },
  {
    tokens: ["Doors"],
    role: "door",
    noun: "door",
    category: "opening",
    dimensions: { width: 2.2, height: 3.4, depth: 0.34 },
  },
  {
    tokens: ["Arches"],
    role: "arch",
    noun: "arch",
    category: "opening",
    tags: ["arched"],
    dimensions: { width: 2.3, height: 3.1, depth: 0.28 },
  },
  {
    tokens: ["ShopFront"],
    role: "shopfront",
    noun: "shopfront",
    category: "opening",
    tags: ["ground-floor", "commercial"],
    dimensions: { width: 3.4, height: 4.0, depth: 0.34 },
  },
  {
    tokens: ["Profiles"],
    role: "profile",
    noun: "profile",
    category: "ornament",
    dimensions: { width: 2.6, height: 0.4, depth: 0.22 },
  },
  {
    tokens: ["Ledge"],
    role: "ledge",
    noun: "ledge",
    category: "ornament",
    dimensions: { width: 2.6, height: 0.45, depth: 0.5 },
  },
  {
    tokens: ["Base"],
    role: "base",
    noun: "base",
    category: "structural",
    dimensions: { width: 3.4, height: 1.15, depth: 0.5 },
  },
  {
    tokens: ["Corner"],
    role: "corner",
    noun: "corner",
    category: "structural",
    dimensions: { width: 1.5, height: 3.2, depth: 1.5 },
  },
  {
    tokens: ["Facade"],
    role: "facade-panel",
    noun: "facade panel",
    category: "panel",
    dimensions: { width: 3.4, height: 3.2, depth: 0.28 },
  },
  {
    tokens: ["Roof", "Tile"],
    role: "roof-tile",
    noun: "roof tile",
    category: "roof",
    dimensions: { width: 1.4, height: 0.3, depth: 1.4 },
  },
  {
    tokens: ["Support"],
    role: "support",
    noun: "support",
    category: "structural",
    dimensions: { width: 0.4, height: 3.1, depth: 0.4 },
  },
  {
    tokens: ["Chimney"],
    role: "chimney",
    noun: "chimney",
    category: "roof",
    dimensions: { width: 0.9, height: 2.6, depth: 0.9 },
  },
];

export const veniceModularBuildingPartsDescriptor = {
  id: "venice-modular-building-parts",
  name: "Venice modular building parts",
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function splitCamelCase(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function tokenizeSourceName(sourceName) {
  return sourceName.split("_").filter(Boolean);
}

function parseInstance(tokens) {
  const lastToken = tokens.at(-1);
  if (lastToken && /^\d+$/.test(lastToken)) {
    return {
      instance: lastToken,
      stemTokens: tokens.slice(0, -1),
    };
  }

  return {
    instance: null,
    stemTokens: tokens,
  };
}

function matchFamilyRule(tokens) {
  const comparable = tokens.map((token) => token.toLowerCase());
  return FAMILY_RULES.find((rule) =>
    rule.tokens.every((token, index) => comparable[index] === token.toLowerCase())
  );
}

function buildFallbackRule(tokens) {
  const familyToken = tokens[0] || "Part";
  const noun = splitCamelCase(familyToken).toLowerCase().replace(/s$/, "");
  return {
    tokens: familyToken ? [familyToken] : [],
    role: slugify(noun) || "part",
    noun,
    category: "module",
    dimensions: { width: 1.8, height: 1.8, depth: 0.3 },
  };
}

function buildVariantFromTokens(tokens, variantSeed, instance) {
  const baseTokens = [...(variantSeed ? [variantSeed] : []), ...tokens];
  const variantCode = baseTokens.length ? baseTokens.join(" ") : "Main";
  const variant = slugify([variantCode, instance].filter(Boolean).join(" "));
  return {
    variantCode,
    variant: variant || "main",
  };
}

function buildPartRecordFromEntry([modulePath, sourcePath]) {
  const sourceFile = modulePath.split("/").at(-1);
  const sourceName = sourceFile.replace(/\.glb$/i, "");
  const rawTokens = tokenizeSourceName(sourceName).filter((token) => token.toLowerCase() !== "venice");
  const { instance, stemTokens } = parseInstance(rawTokens);
  const familyRule = matchFamilyRule(stemTokens) || buildFallbackRule(stemTokens);
  const remainingTokens = stemTokens.slice(familyRule.tokens.length);
  const { variantCode, variant } = buildVariantFromTokens(
    remainingTokens,
    familyRule.variantSeed,
    instance
  );
  const tags = [...(familyRule.tags || [])];
  const variantTokens = variantCode === "Main" ? [] : variantCode.split(/\s+/);

  if (variantTokens.includes("A")) tags.push("variant-a");
  if (variantTokens.includes("B")) tags.push("variant-b");
  if (variantTokens.includes("C")) tags.push("variant-c");
  if (variantTokens.some((token) => token.toLowerCase() === "big")) tags.push("big");

  return {
    id: slugify(sourceName),
    label: `${titleCase(familyRule.noun)} ${variantCode}${instance ? ` ${instance}` : ""}`.trim(),
    sourceName,
    sourceFile,
    sourcePath,
    role: familyRule.role,
    noun: familyRule.noun,
    category: familyRule.category,
    family: slugify(
      [familyRule.role, variantCode !== "Main" ? variantCode : null].filter(Boolean).join(" ")
    ),
    variantCode,
    instance,
    variant,
    tags,
    dimensions: familyRule.dimensions,
    correction: {
      rotate: { x: 0, y: 0, z: 0 },
      uniformScale: 1,
    },
    notes: "Derived from the GLB filename convention. Dimensions are provisional until measured from mesh.",
  };
}

function buildCatalogFromSourceFiles() {
  return Object.entries(SOURCE_GLOBS)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(buildPartRecordFromEntry);
}

export async function loadVeniceModularBuildingPartsCatalog() {
  const parts = buildCatalogFromSourceFiles();

  return normalizeCatalog(
    {
      id: veniceModularBuildingPartsDescriptor.id,
      name: veniceModularBuildingPartsDescriptor.name,
      sourceRoot: SOURCE_ROOT,
      sourceOrientation: {
        right: "+X",
        up: "+Z",
        forward: "+Y",
      },
      normalization: {
        units: "meters",
        axes: {
          right: "+X",
          up: "+Y",
          outward: "+Z",
        },
      },
      parts,
    },
    {
      ...veniceModularBuildingPartsDescriptor,
      adapter: "venice-modular-building-parts",
      sourceRoot: SOURCE_ROOT,
      sourceConvention:
        "Vite glob over GLB files with semantic parsing from filename noun groups and variant suffixes.",
    }
  );
}
