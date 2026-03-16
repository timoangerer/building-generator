export { createAtmosphericSky } from "./atmospheric";
export { createGradientSky } from "./gradient-sky";

import { registerLayer } from "../registry";
import { createAtmosphericSky } from "./atmospheric";
import { createGradientSky } from "./gradient-sky";

registerLayer("sky", "atmospheric", createAtmosphericSky);
registerLayer("sky", "gradient", createGradientSky);
