import type { EnvLayer } from "./types";

export type LayerCategory = "water" | "sky" | "terrain";

export type LayerFactory = () => EnvLayer;

interface LayerEntry {
  id: string;
  category: LayerCategory;
  factory: LayerFactory;
}

const entries: LayerEntry[] = [];

export function registerLayer(
  category: LayerCategory,
  id: string,
  factory: LayerFactory,
): void {
  entries.push({ id, category, factory });
}

export function getLayerIds(category: LayerCategory): string[] {
  return entries.filter((e) => e.category === category).map((e) => e.id);
}

export function createLayer(
  category: LayerCategory,
  id: string,
): EnvLayer | undefined {
  const entry = entries.find((e) => e.category === category && e.id === id);
  return entry?.factory();
}
