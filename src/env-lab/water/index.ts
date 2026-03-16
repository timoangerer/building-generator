export { createThreejsOcean } from "./threejs-ocean";
export { createBackdropWater } from "./backdrop-water";

import { registerLayer } from "../registry";
import { createThreejsOcean } from "./threejs-ocean";
import { createBackdropWater } from "./backdrop-water";

registerLayer("water", "threejs-ocean", createThreejsOcean);
registerLayer("water", "backdrop-water", createBackdropWater);
