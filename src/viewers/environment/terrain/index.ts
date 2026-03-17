export { simplex2 } from "./simplex-noise";
export { createPlateauNoise } from "./plateau-noise";
export { createLayeredStrata } from "./layered-strata";
export { createSmoothSlope } from "./smooth-slope";

import { registerLayer } from "../registry";
import { createPlateauNoise } from "./plateau-noise";
import { createLayeredStrata } from "./layered-strata";
import { createSmoothSlope } from "./smooth-slope";

registerLayer("terrain", "plateau-noise", createPlateauNoise);
registerLayer("terrain", "layered-strata", createLayeredStrata);
registerLayer("terrain", "smooth-slope", createSmoothSlope);
