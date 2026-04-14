import type {
  FacadeGrammar,
  FloorRule,
  FloorMatch,
  BayPatternEntry,
  BayPosition,
  BayRule,
  ElementSlotRef,
  ElementDefinition,
  FloorInfo,
} from "@/contracts";

export type ResolvedBayCell = {
  floorIndex: number;
  bayIndex: number;
  element: ElementDefinition | null;
};

export type ResolvedBayGrid = ResolvedBayCell[];

/**
 * Resolve a facade grammar into concrete element assignments for each (floor, bay) cell.
 */
export function resolveBayGrid(
  grammar: FacadeGrammar,
  floors: FloorInfo[],
  bayCount: number,
  catalog: ElementDefinition[],
  rng: () => number,
): ResolvedBayGrid {
  const floorCount = floors.length;
  const catalogMap = new Map<string, ElementDefinition>();
  for (const el of catalog) {
    catalogMap.set(el.elementId, el);
  }

  // Cache for placeholder elements so we reuse the same definition
  const placeholderCache = new Map<string, ElementDefinition>();

  const grid: ResolvedBayGrid = [];

  for (const floor of floors) {
    const floorRule = findFloorRule(grammar.floorRules, floor.floorIndex, floorCount);
    const bayPattern = floorRule ? floorRule.bayPattern : [];

    // Resolve bays — if mirror symmetry, resolve left half then mirror
    const useMirror = grammar.symmetry === "mirror";
    const halfCount = useMirror ? Math.ceil(bayCount / 2) : bayCount;

    const rowElements: (ElementDefinition | null)[] = new Array(bayCount).fill(null);

    for (let bay = 0; bay < halfCount; bay++) {
      const entry = findBayPatternEntry(bayPattern, bay, bayCount);
      const rules = entry ? entry.rules : [];

      let slot: ElementSlotRef;
      if (rules.length > 0) {
        const rule = pickWeightedRule(rules, rng);
        slot = rule.slot;
      } else {
        slot = grammar.defaultSlot;
      }

      const element = resolveSlot(slot, catalogMap, placeholderCache, grammar.defaultSlot);
      rowElements[bay] = element;
    }

    // Mirror the left half to the right half
    if (useMirror) {
      for (let bay = 0; bay < bayCount; bay++) {
        const mirrorSource = bayCount - 1 - bay;
        if (mirrorSource < halfCount && bay >= halfCount) {
          rowElements[bay] = rowElements[mirrorSource];
        }
      }
    }

    for (let bay = 0; bay < bayCount; bay++) {
      grid.push({
        floorIndex: floor.floorIndex,
        bayIndex: bay,
        element: rowElements[bay],
      });
    }
  }

  return grid;
}

function findFloorRule(
  rules: FloorRule[],
  floorIndex: number,
  floorCount: number,
): FloorRule | null {
  for (const rule of rules) {
    if (matchesFloor(rule.match, floorIndex, floorCount)) {
      return rule;
    }
  }
  return null;
}

function matchesFloor(
  match: FloorMatch,
  floorIndex: number,
  floorCount: number,
): boolean {
  if (match === "ground") return floorIndex === 0;
  if (match === "top") return floorIndex === floorCount - 1 && floorCount >= 2;
  if (match === "middle") return floorIndex > 0 && (floorCount < 2 || floorIndex < floorCount - 1);
  if (match === "all") return true;
  if (typeof match === "object" && "index" in match) return floorIndex === match.index;
  return false;
}

function findBayPatternEntry(
  pattern: BayPatternEntry[],
  bayIndex: number,
  bayCount: number,
): BayPatternEntry | null {
  for (const entry of pattern) {
    if (matchesBayPosition(entry.position, bayIndex, bayCount)) {
      return entry;
    }
  }
  return null;
}

function matchesBayPosition(
  position: BayPosition,
  bayIndex: number,
  bayCount: number,
): boolean {
  switch (position) {
    case "all":
      return true;
    case "center": {
      if (bayCount % 2 === 1) {
        return bayIndex === Math.floor(bayCount / 2);
      }
      // Even bay count: center 2 bays
      const mid = bayCount / 2;
      return bayIndex === mid - 1 || bayIndex === mid;
    }
    case "edges":
      return bayIndex === 0 || bayIndex === bayCount - 1;
    case "inner":
      return bayIndex > 0 && bayIndex < bayCount - 1;
    case "even":
      return bayIndex % 2 === 0;
    case "odd":
      return bayIndex % 2 === 1;
    default:
      return false;
  }
}

function pickWeightedRule(rules: BayRule[], rng: () => number): BayRule {
  if (rules.length === 1) return rules[0];

  let totalWeight = 0;
  for (const rule of rules) {
    totalWeight += rule.weight ?? 1;
  }

  let roll = rng() * totalWeight;
  for (const rule of rules) {
    roll -= rule.weight ?? 1;
    if (roll <= 0) return rule;
  }

  return rules[rules.length - 1];
}

function resolveSlot(
  slot: ElementSlotRef,
  catalog: Map<string, ElementDefinition>,
  placeholderCache: Map<string, ElementDefinition>,
  defaultSlot: ElementSlotRef,
): ElementDefinition | null {
  switch (slot.kind) {
    case "by-id": {
      const el = catalog.get(slot.elementId);
      if (el) return el;
      // Element not in catalog — fall through to default if this isn't already the default
      if (defaultSlot.kind !== "by-id" || defaultSlot.elementId !== slot.elementId) {
        return resolveSlot(defaultSlot, catalog, placeholderCache, defaultSlot);
      }
      return null;
    }
    case "placeholder": {
      const key = slot.label;
      let el = placeholderCache.get(key);
      if (!el) {
        el = createPlaceholderElement(slot.label, slot.width, slot.height, slot.color);
        placeholderCache.set(key, el);
      }
      return el;
    }
    case "empty":
      return null;
  }
}

function createPlaceholderElement(
  label: string,
  width: number,
  height: number,
  _color?: string,
): ElementDefinition {
  return {
    elementId: `placeholder:${label}`,
    type: "wall_panel",
    geometry: {
      type: "box",
      box: { width, height, depth: 0.05 },
    },
  };
}
