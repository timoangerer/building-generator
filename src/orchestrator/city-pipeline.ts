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

  const allWalls = massingResult.buildings.flatMap((b) => b.walls);
  const allFloors = massingResult.buildings[0]?.floors ?? [];

  const facadeResult = generateFacade({
    seed,
    walls: allWalls,
    floors: allFloors,
    availableElements: catalog.elements,
    bayWidth: 2.5,
    edgeMargin: 0.5,
  });

  const buildingResult = assembleBuildings(
    { seed },
    massingResult.buildings,
    facadeResult.facades
  );

  return composeScene(
    { seed },
    buildingResult.buildings,
    plotResult.streets,
    catalog
  );
}
