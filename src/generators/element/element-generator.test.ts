import { ElementCatalogSchema } from "@/contracts/element.schema";
import { generateElementCatalog } from "./element-generator";
import { testGeneratorInvariants } from "@/test-utils";
import type { ElementCatalogConfig } from "@/contracts";

testGeneratorInvariants({
  name: "generateElementCatalog",
  generator: generateElementCatalog,
  schema: ElementCatalogSchema,
  configFactory: (seed): ElementCatalogConfig => ({ seed }),
  invariants: [
    {
      name: "contains required element IDs",
      check: (r) => {
        const ids = r.elements.map((e) => e.elementId);
        return (
          ids.includes("window-small") &&
          ids.includes("window-large") &&
          ids.includes("door-standard") &&
          ids.includes("wall-panel")
        );
      },
    },
  ],
});
