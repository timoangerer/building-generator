import { z } from "zod";

export const ElementTypeSchema = z.enum(["window", "door", "wall_panel"]);

export const BoxGeometrySchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

const Vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

const BoxPartSchema = z.object({
  shape: z.literal("box"),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  role: z.string(),
  position: Vec3Schema,
});

const CylinderPartSchema = z.object({
  shape: z.literal("cylinder"),
  dimensions: z.object({
    radius: z.number().positive(),
    height: z.number().positive(),
  }),
  role: z.string(),
  position: Vec3Schema,
});

const HalfCylinderPartSchema = z.object({
  shape: z.literal("half_cylinder"),
  dimensions: z.object({
    radius: z.number().positive(),
    depth: z.number().positive(),
  }),
  role: z.string(),
  position: Vec3Schema,
});

export const GeometryPartSchema = z.discriminatedUnion("shape", [
  BoxPartSchema,
  CylinderPartSchema,
  HalfCylinderPartSchema,
]);

export const ElementGeometrySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("box"),
    box: BoxGeometrySchema,
  }),
  z.object({
    type: z.literal("composite"),
    parts: z.array(GeometryPartSchema).min(1),
  }),
]);

export const ColorPaletteSchema = z.record(z.string(), z.number());

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
  defaultPalette: ColorPaletteSchema,
});
