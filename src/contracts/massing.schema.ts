import { z } from "zod";
import { Vec2Schema, Polygon2DSchema } from "./base.schema";

export const MassingConfigSchema = z.object({
  seed: z.number(),
  plots: z.array(
    z.object({
      plotId: z.string(),
      footprint: Polygon2DSchema,
    })
  ),
  floorHeight: z.number(),
  floorCountRange: z.tuple([z.number(), z.number()]),
  heightVariation: z.number(),
});

export const FloorInfoSchema = z.object({
  floorIndex: z.number(),
  baseY: z.number(),
  height: z.number(),
});

export const WallSegmentSchema = z.object({
  buildingId: z.string(),
  wallIndex: z.number(),
  start: Vec2Schema,
  end: Vec2Schema,
  height: z.number(),
  length: z.number(),
  neighborBuildingId: z.string().optional(),
  normal: Vec2Schema,
});

export const BuildingMassingSchema = z.object({
  buildingId: z.string(),
  plotId: z.string(),
  footprint: Polygon2DSchema,
  totalHeight: z.number(),
  floors: z.array(FloorInfoSchema),
  walls: z.array(WallSegmentSchema),
});

export const MassingResultSchema = z.object({
  config: MassingConfigSchema,
  buildings: z.array(BuildingMassingSchema),
});
