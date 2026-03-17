import type * as THREE from "three";

export interface ParamDescriptor {
  key: string;
  label: string;
  type: "number" | "color";
  min?: number;
  max?: number;
  step?: number;
  default: number | string;
}

export interface EnvLayer {
  name: string;
  create(scene: THREE.Scene, camera: THREE.Camera): void;
  update(dt: number, elapsed: number): void;
  setParam(key: string, value: number | string): void;
  getParams(): ParamDescriptor[];
  dispose(): void;
}

export interface FogConfig {
  enabled: boolean;
  type: "linear" | "exponential";
  color: string;
  near?: number;
  far?: number;
  density?: number;
}

export interface EnvPreset {
  name: string;
  water: string;
  sky: string;
  terrain: string;
  fog: FogConfig;
  overrides?: Record<string, Record<string, number | string>>;
}
