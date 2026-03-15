import type { SceneResult } from "@/contracts";
import { generatePlots } from "@/generators/plot";
import { generateMassing } from "@/generators/massing";
import { generateElementCatalog } from "@/generators/element";
import { generateFacade } from "@/generators/facade";
import { assembleBuildings, composeScene } from "@/generators/building";

export function runCityPipeline(seed: number): SceneResult {
  const plotResult = generatePlots({
    seed,
    streetLength: 30,
    streetWidth: 6,
    plotDepth: 15,
    minPlotWidth: 8,
    maxPlotWidth: 14,
  });

  const massingResult = generateMassing({
    seed,
    plots: plotResult.plots.map((p) => ({
      plotId: p.id,
      footprint: p.footprint,
    })),
    floorHeight: 3,
    floorCountRange: [3, 5],
    heightVariation: 0.2,
  });

  const catalog = generateElementCatalog({ seed });

  // Call generateFacade per building with each building's own walls and floors
  const allFacades = massingResult.buildings.flatMap((building) => {
    const facadeResult = generateFacade({
      seed,
      walls: building.walls,
      floors: building.floors,
      availableElements: catalog.elements,
      bayWidth: 2.5,
      edgeMargin: 0.5,
    });
    return facadeResult.facades;
  });

  const buildingResult = assembleBuildings(
    { seed },
    massingResult.buildings,
    allFacades,
  );

  return composeScene(
    { seed },
    buildingResult.buildings,
    plotResult.streets,
    catalog,
  );
}
