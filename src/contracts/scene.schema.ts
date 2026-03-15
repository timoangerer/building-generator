import { z } from "zod";
import { AABB2Schema } from "./base.schema";
import { BuildingSchema } from "./building.schema";
import { StreetSchema } from "./plot.schema";
import { ElementCatalogSchema } from "./element.schema";

export const SceneConfigSchema = z.object({
  seed: z.number(),
});

export const SceneSchema = z.object({
  buildings: z.array(BuildingSchema),
  streets: z.array(StreetSchema),
  elementCatalog: ElementCatalogSchema,
  sceneBounds: AABB2Schema,
});

export const SceneResultSchema = z.object({
  config: SceneConfigSchema,
  scene: SceneSchema,
});
