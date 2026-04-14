import { z } from "zod";

export const ElementSlotRefSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("by-id"),
    elementId: z.string(),
  }),
  z.object({
    kind: z.literal("placeholder"),
    label: z.string(),
    width: z.number().positive(),
    height: z.number().positive(),
    color: z.string().optional(),
  }),
  z.object({
    kind: z.literal("empty"),
  }),
]);

export const BayRuleSchema = z.object({
  slot: ElementSlotRefSchema,
  weight: z.number().positive().optional(),
});

export const BayPositionSchema = z.enum([
  "all",
  "center",
  "edges",
  "inner",
  "even",
  "odd",
]);

export const BayPatternEntrySchema = z.object({
  position: BayPositionSchema,
  rules: z.array(BayRuleSchema).min(1),
});

export const FloorMatchSchema = z.union([
  z.literal("ground"),
  z.literal("top"),
  z.literal("middle"),
  z.literal("all"),
  z.object({ index: z.number().int().nonnegative() }),
]);

export const FloorRuleSchema = z.object({
  match: FloorMatchSchema,
  bayPattern: z.array(BayPatternEntrySchema).min(1),
});

export const FacadeGrammarSchema = z.object({
  grammarId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  floorRules: z.array(FloorRuleSchema).min(1),
  defaultSlot: ElementSlotRefSchema,
  symmetry: z.enum(["none", "mirror"]).optional(),
});
