import { ElementCatalogSchema } from "@/contracts/element.schema";
import { generateElementCatalog } from "@/generators/element";
import type { ElementCatalogConfig, ElementCatalog, GeometryPart } from "@/contracts";
import type { GeneratorFixture } from "./types";

const EXPECTED_IDS = [
  "window-tall",
  "window-arched",
  "window-shuttered",
  "window-arch-shut",
  "window-small-sq",
  "door-arched",
  "door-paneled",
  "balcony-door-iron",
  "balcony-door-stone",
];

function allParts(catalog: ElementCatalog): GeometryPart[] {
  return catalog.elements.flatMap((e) =>
    e.geometry.type === "composite" ? e.geometry.parts : [],
  );
}

function allRoles(catalog: ElementCatalog): Set<string> {
  return new Set(allParts(catalog).map((p) => p.role));
}

export const elementFixture: GeneratorFixture<ElementCatalogConfig, ElementCatalog> = {
  name: "generateElementCatalog",
  stage: "element",
  generator: generateElementCatalog,
  schema: ElementCatalogSchema,
  configFactory: (seed): ElementCatalogConfig => ({ seed }),
  seeds: [1, 42, 123, 999],
  invariants: [
    {
      name: "contains all 9 Mediterranean element IDs",
      check: (r) => {
        const ids = r.elements.map((e) => e.elementId);
        return EXPECTED_IDS.every((id) => ids.includes(id)) && ids.length === 9;
      },
    },
    {
      name: "shuttered windows have shutter role parts",
      check: (r) => {
        for (const id of ["window-shuttered", "window-arch-shut"]) {
          const el = r.elements.find((e) => e.elementId === id);
          if (!el || el.geometry.type !== "composite") return false;
          if (!el.geometry.parts.some((p) => p.role === "shutter")) return false;
        }
        return true;
      },
    },
    {
      name: "arched elements have half_cylinder parts",
      check: (r) => {
        for (const id of ["window-arched", "window-arch-shut", "door-arched"]) {
          const el = r.elements.find((e) => e.elementId === id);
          if (!el || el.geometry.type !== "composite") return false;
          if (!el.geometry.parts.some((p) => p.shape === "half_cylinder")) return false;
        }
        return true;
      },
    },
    {
      name: "balcony-door elements are self-contained with slab and railing",
      check: (r) => {
        for (const id of ["balcony-door-iron", "balcony-door-stone"]) {
          const el = r.elements.find((e) => e.elementId === id);
          if (!el || el.geometry.type !== "composite") return false;
          const roles = new Set(el.geometry.parts.map((p) => p.role));
          if (!roles.has("pane") || !roles.has("slab") || !roles.has("railing")) return false;
        }
        return true;
      },
    },
    {
      name: "default palette covers every role used across all elements",
      check: (r) => {
        const roles = allRoles(r);
        for (const role of roles) {
          if (!(role in r.defaultPalette)) return false;
        }
        return true;
      },
    },
  ],
};
