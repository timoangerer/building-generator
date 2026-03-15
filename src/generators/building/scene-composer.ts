import type {
  SceneConfig,
  SceneResult,
  Building,
  Street,
  ElementCatalog,
  AABB2,
} from "@/contracts";

function computeSceneBounds(buildings: Building[], streets: Street[]): AABB2 {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;

  for (const b of buildings) {
    for (const v of b.massing.footprint) {
      if (v.x < minX) minX = v.x;
      if (v.z < minZ) minZ = v.z;
      if (v.x > maxX) maxX = v.x;
      if (v.z > maxZ) maxZ = v.z;
    }
  }

  for (const s of streets) {
    for (const v of [s.start, s.end]) {
      if (v.x < minX) minX = v.x;
      if (v.z < minZ) minZ = v.z;
      if (v.x > maxX) maxX = v.x;
      if (v.z > maxZ) maxZ = v.z;
    }
  }

  if (!isFinite(minX)) {
    return { min: { x: 0, z: 0 }, max: { x: 0, z: 0 } };
  }

  return { min: { x: minX, z: minZ }, max: { x: maxX, z: maxZ } };
}

export function composeScene(
  config: SceneConfig,
  buildings: Building[],
  streets: Street[],
  catalog: ElementCatalog
): SceneResult {
  return {
    config,
    scene: {
      buildings,
      streets,
      elementCatalog: catalog,
      sceneBounds: computeSceneBounds(buildings, streets),
    },
  };
}
