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

export const PlacementWarningSchema = z.object({
  floorIndex: z.number(),
  bayIndex: z.number(),
  elementId: z.string(),
  type: z.enum([
    "overflow-top",
    "overflow-bottom",
    "overflow-left",
    "overflow-right",
    "empty-bay",
  ]),
  overflowAmount: z.number().optional(),
});

export const FacadeLayoutElementSchema = z.object({
  elementId: z.string(),
  elementType: z.enum(["window", "door", "wall_panel"]),
  floorIndex: z.number(),
  bayIndex: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  scale: z.number(),
});

export const FacadeLayoutSchema = z.object({
  wallLength: z.number(),
  totalHeight: z.number(),
  bayWidth: z.number(),
  edgeMargin: z.number(),
  bayCount: z.number(),
  floors: z.array(
    z.object({
      floorIndex: z.number(),
      baseY: z.number(),
      height: z.number(),
    }),
  ),
  elements: z.array(FacadeLayoutElementSchema),
  warnings: z.array(PlacementWarningSchema),
});

export const WallFacadeSchema = z.object({
  buildingId: z.string(),
  wallIndex: z.number(),
  placements: z.array(ElementPlacementSchema),
  bayGrid: z.array(BayGridEntrySchema).optional(),
  warnings: z.array(PlacementWarningSchema).optional(),
  layout: FacadeLayoutSchema.optional(),
});

export const FacadeResultSchema = z.object({
  config: FacadeConfigSchema,
  facades: z.array(WallFacadeSchema),
});
