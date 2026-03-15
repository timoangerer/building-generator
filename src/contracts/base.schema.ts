import { z } from "zod";

export const Vec2Schema = z.object({
  x: z.number(),
  z: z.number(),
});

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const Polygon2DSchema = z.array(Vec2Schema).min(3);

export const AABB2Schema = z.object({
  min: Vec2Schema,
  max: Vec2Schema,
});
