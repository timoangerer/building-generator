/** How a slot references elements in the catalog */
export type ElementSlotRef =
  | { kind: "by-id"; elementId: string }
  | { kind: "placeholder"; label: string; width: number; height: number; color?: string }
  | { kind: "empty" };

/** A bay rule with weighted random selection among alternatives */
export type BayRule = {
  slot: ElementSlotRef;
  weight?: number; // default 1.0
};

/** Which bays a pattern entry applies to */
export type BayPosition =
  | "all"
  | "center"
  | "edges"
  | "inner"
  | "even"
  | "odd";

/** Associates a bay position matcher with element rules */
export type BayPatternEntry = {
  position: BayPosition;
  rules: BayRule[]; // if multiple, pick by weighted random
};

/** Which floors a rule applies to */
export type FloorMatch =
  | "ground"
  | "top"
  | "middle"
  | "all"
  | { index: number };

/** A floor rule: matches floors and assigns bay patterns */
export type FloorRule = {
  match: FloorMatch;
  bayPattern: BayPatternEntry[]; // evaluated in order; first matching position wins
};

/** A complete facade grammar preset */
export type FacadeGrammar = {
  grammarId: string;
  name: string;
  description?: string;
  floorRules: FloorRule[]; // evaluated in order; first matching floor wins
  defaultSlot: ElementSlotRef; // fallback when no rule matches
  symmetry?: "none" | "mirror";
};
