import { z } from "zod";
import { BuildingMassingSchema } from "./massing.schema";
import { WallFacadeSchema } from "./facade.schema";

export const BuildingConfigSchema = z.object({
  seed: z.number(),
});

export const BuildingSchema = z.object({
  buildingId: z.string(),
  plotId: z.string(),
  massing: BuildingMassingSchema,
  facades: z.array(WallFacadeSchema),
});

export const BuildingResultSchema = z.object({
  config: BuildingConfigSchema,
  buildings: z.array(BuildingSchema),
});
