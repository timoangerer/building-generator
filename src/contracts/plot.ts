import type { Vec2, Polygon2D, AABB2 } from "./base";

export type PlotConfig = {
  seed: number;
  streetLength: number;
  streetWidth: number;
  plotDepth: number;
  minPlotWidth: number;
  maxPlotWidth: number;
};

export type Plot = {
  id: string;
  footprint: Polygon2D;
  bounds: AABB2;
  row: "A" | "B";
};

export type Street = {
  id: string;
  start: Vec2;
  end: Vec2;
  width: number;
};

export type PlotResult = {
  config: PlotConfig;
  plots: Plot[];
  streets: Street[];
};
