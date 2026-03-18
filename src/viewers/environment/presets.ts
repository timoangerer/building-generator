import type { EnvPreset } from "./types";

export const presets: EnvPreset[] = [
  {
    name: "Backdrop Ocean",
    water: "backdrop-water",
    sky: "gradient",
    terrain: "plateau-noise",
    fog: { enabled: false, type: "linear", color: "#0487e2" },
  },
  {
    name: "Ocean (WebGL)",
    water: "threejs-ocean",
    sky: "atmospheric",
    terrain: "plateau-noise",
    fog: { enabled: false, type: "linear", color: "#a0c0e0" },
  },
  {
    name: "Midday",
    water: "backdrop-water",
    sky: "gradient",
    terrain: "smooth-slope",
    fog: { enabled: false, type: "linear", color: "#74ccf4" },
    overrides: {
      gradient: { sunElevation: 60, horizonColor: "#87ceeb", zenithColor: "#1a5fb4" },
    },
  },
  {
    name: "Dramatic",
    water: "backdrop-water",
    sky: "gradient",
    terrain: "plateau-noise",
    fog: { enabled: false, type: "linear", color: "#c08040" },
    overrides: {
      gradient: { sunElevation: 5, horizonColor: "#e07020", zenithColor: "#2a1a4a" },
    },
  },
];
