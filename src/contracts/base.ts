export type Vec2 = {
  x: number;
  z: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Polygon2D = Vec2[];

export type AABB2 = {
  min: Vec2;
  max: Vec2;
};
