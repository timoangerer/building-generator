import type { FacadeGrammar } from "@/contracts";
import { mediterraneanGrammar } from "./mediterranean";
import { neoclassicalGrammar } from "./neoclassical";

export { mediterraneanGrammar } from "./mediterranean";
export { neoclassicalGrammar } from "./neoclassical";

export const allGrammarPresets: FacadeGrammar[] = [
  mediterraneanGrammar,
  neoclassicalGrammar,
];
