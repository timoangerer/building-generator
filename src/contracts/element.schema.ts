import { z } from "zod";

export const ElementTypeSchema = z.enum(["window", "door", "wall_panel"]);

export const BoxGeometrySchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

export const ElementGeometrySchema = z.object({
  type: z.literal("box"),
  box: BoxGeometrySchema,
});

export const ElementDefinitionSchema = z.object({
  elementId: z.string(),
  type: ElementTypeSchema,
  geometry: ElementGeometrySchema,
});

export const ElementCatalogConfigSchema = z.object({
  seed: z.number(),
});

export const ElementCatalogSchema = z.object({
  config: ElementCatalogConfigSchema,
  elements: z.array(ElementDefinitionSchema),
});
