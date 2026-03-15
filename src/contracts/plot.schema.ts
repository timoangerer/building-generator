import { z } from "zod";
import { Vec2Schema, Polygon2DSchema, AABB2Schema } from "./base.schema";

export const PlotConfigSchema = z.object({
  seed: z.number(),
  streetLength: z.number(),
  streetWidth: z.number(),
  plotDepth: z.number(),
  minPlotWidth: z.number(),
  maxPlotWidth: z.number(),
});

export const PlotSchema = z.object({
  id: z.string(),
  footprint: Polygon2DSchema,
  bounds: AABB2Schema,
  row: z.enum(["A", "B"]),
});

export const StreetSchema = z.object({
  id: z.string(),
  start: Vec2Schema,
  end: Vec2Schema,
  width: z.number(),
});

export const PlotResultSchema = z.object({
  config: PlotConfigSchema,
  plots: z.array(PlotSchema),
  streets: z.array(StreetSchema),
});
