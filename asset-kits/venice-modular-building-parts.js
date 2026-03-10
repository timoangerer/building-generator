import { normalizeCatalog } from "../asset-library.js";

const KIT_URL = "./assets/Venice modular building parts/kit.json";

export const veniceModularBuildingPartsDescriptor = {
  id: "venice-modular-building-parts",
  name: "Venice modular building parts",
};

export async function loadVeniceModularBuildingPartsCatalog() {
  const response = await fetch(KIT_URL);
  if (!response.ok) {
    throw new Error(`Could not load ${KIT_URL} (${response.status})`);
  }

  const rawCatalog = await response.json();
  return normalizeCatalog(rawCatalog, {
    ...veniceModularBuildingPartsDescriptor,
    adapter: "venice-modular-building-parts",
    sourceRoot: "./assets/Venice modular building parts/",
    sourceConvention: "Blender export with source-specific names that need semantic mapping.",
  });
}
