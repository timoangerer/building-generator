import { z } from "zod";
import { Vec3Schema } from "./base.schema";
import { WallSegmentSchema, FloorInfoSchema } from "./massing.schema";
import { ElementDefinitionSchema } from "./element.schema";

export const FacadeConfigSchema = z.object({
  seed: z.number(),
  walls: z.array(WallSegmentSchema),
  floors: z.array(FloorInfoSchema),
  availableElements: z.array(ElementDefinitionSchema),
  bayWidth: z.number(),
  edgeMargin: z.number(),
});

export const ElementPlacementSchema = z.object({
  elementId: z.string(),
  position: Vec3Schema,
  rotationY: z.number(),
  scale: Vec3Schema.optional(),
});

export const BayGridEntrySchema = z.object({
  floorIndex: z.number(),
  bayIndex: z.number(),
  elementId: z.string(),
});

export const WallFacadeSchema = z.object({
  buildingId: z.string(),
  wallIndex: z.number(),
  placements: z.array(ElementPlacementSchema),
  bayGrid: z.array(BayGridEntrySchema).optional(),
});

export const FacadeResultSchema = z.object({
  config: FacadeConfigSchema,
  facades: z.array(WallFacadeSchema),
});
